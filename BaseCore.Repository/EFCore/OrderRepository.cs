using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Order Repository using Entity Framework Core
    /// </summary>
    public interface IOrderRepositoryEF : IRepository<Order>
    {
        Task<List<Order>> GetByUserAsync(string userId);
        Task<Order?> GetWithDetailsAsync(int orderId);
        Task<List<OrderByUserResult>> GetOrderHistoryByUserAsync(string userId);
        Task<List<OrderAdminResult>> SearchAdminOrdersAsync(string? keyword);
        Task<int> CheckoutAsync(string userId, Order order, List<OrderDetail> details, string? couponCode);
        Task UpdateStatusAsync(int id, string status);
        Task<Order> CancelOrderAsync(int id, string reason);
        Task DeleteWithDetailsAsync(int id);
        Task<Order> UpdatePendingOrderAsync(int id, PendingOrderUpdateData data);
    }

    public class OrderRepositoryEF : Repository<Order>, IOrderRepositoryEF
    {
        public OrderRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        public async Task<List<Order>> GetByUserAsync(string userId)
        {
            return await _dbSet
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetWithDetailsAsync(int orderId)
        {
            return await _dbSet
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);
        }

        public async Task<List<OrderByUserResult>> GetOrderHistoryByUserAsync(string userId)
        {
            return await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new OrderByUserResult
                {
                    Id = o.Id,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    PaymentMethod = o.PaymentMethod,
                    ReceiverName = o.ReceiverName,
                    ShippingAddress = o.ShippingAddress,
                    Phone = o.Phone,
                    OrderNotes = o.OrderNotes,
                    CancelReason = o.CancelReason,
                    CancelledAt = o.CancelledAt,
                    Details = _context.OrderDetails
                        .Where(od => od.OrderId == o.Id)
                        .Select(od => new OrderDetailResult
                        {
                            ProductId = od.ProductId,
                            ProductName = _context.Products
                                .Where(p => p.Id == od.ProductId)
                                .Select(p => p.Name)
                                .FirstOrDefault(),
                            ProductImageUrl = _context.Products
                                .Where(p => p.Id == od.ProductId)
                                .Select(p => p.ImageUrl)
                                .FirstOrDefault(),
                            Quantity = od.Quantity,
                            UnitPrice = od.UnitPrice,
                            IsReviewed = _context.ProductReviews
                                .Any(r => r.OrderId == o.Id && r.ProductId == od.ProductId)
                        })
                        .ToList()
                })
                .ToListAsync();
        }

        public async Task<List<OrderAdminResult>> SearchAdminOrdersAsync(string? keyword)
        {
            var query = _context.Orders.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var searchLower = keyword.ToLower().Trim();
                var mappedStatus = searchLower switch
                {
                    var s when s.Contains("cho xu ly") || s.Contains("chờ xử lý") => "Pending",
                    var s when s.Contains("cho van chuyen") || s.Contains("chờ vận chuyển") => "Processing",
                    var s when s.Contains("dang van chuyen") || s.Contains("đang vận chuyển") => "Shipping",
                    var s when s.Contains("hoan thanh") || s.Contains("hoàn thành") => "Completed",
                    var s when s.Contains("huy") || s.Contains("hủy") => "Cancelled",
                    _ => searchLower
                };

                var isNumeric = int.TryParse(searchLower, out var parsedId);
                var isDecimal = decimal.TryParse(searchLower, out var parsedAmount);

                query = query.Where(o =>
                    (isNumeric && o.Id == parsedId) ||
                    (isDecimal && o.TotalAmount == parsedAmount) ||
                    (o.Status != null && o.Status.ToLower().Contains(mappedStatus)) ||
                    _context.Users.Any(u => u.Id == o.UserId && u.Name.ToLower().Contains(searchLower)));
            }

            return await query
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new OrderAdminResult
                {
                    Id = o.Id,
                    UserId = o.UserId,
                    CustomerName = _context.Users
                        .Where(u => u.Id == o.UserId)
                        .Select(u => u.Name)
                        .FirstOrDefault() ?? "Khach vang lai",
                    TotalAmount = o.TotalAmount,
                    Status = o.Status,
                    OrderDate = o.OrderDate
                })
                .ToListAsync();
        }

        public async Task<int> CheckoutAsync(string userId, Order order, List<OrderDetail> details, string? couponCode)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists)
                    throw new InvalidOperationException("Tai khoan dat hang khong ton tai trong he thong!");

                var cleanCouponCode = string.IsNullOrWhiteSpace(couponCode) ? null : couponCode.Trim().ToUpper();
                var couponDiscountPercent = 0;
                if (cleanCouponCode != null)
                {
                    var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == cleanCouponCode);
                    if (coupon == null)
                        throw new InvalidOperationException("Ma giam gia khong ton tai!");
                    if (!coupon.IsActive)
                        throw new InvalidOperationException("Ma giam gia nay da bi khoa!");
                    if (coupon.ExpiryDate < DateTime.Now)
                        throw new InvalidOperationException("Ma giam gia nay da het han!");

                    var couponType = string.IsNullOrWhiteSpace(coupon.CouponType)
                        ? "Public"
                        : coupon.CouponType.Trim();

                    if (couponType != "Public")
                    {
                        if (string.IsNullOrWhiteSpace(coupon.UserId) || coupon.UserId != userId)
                            throw new InvalidOperationException("Voucher nay chi ap dung cho tai khoan duoc tang!");
                    }

                    if (coupon.MinOrderAmount.HasValue && order.SubTotal < coupon.MinOrderAmount.Value)
                        throw new InvalidOperationException($"Don hang phai tu {coupon.MinOrderAmount.Value:N0} d moi dung duoc voucher nay!");

                    if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
                        throw new InvalidOperationException("Voucher nay da het luot su dung!");

                    coupon.UsedCount += 1;
                    couponDiscountPercent = coupon.DiscountPercent;
                }

                var discountAmount = order.SubTotal * couponDiscountPercent / 100m;
                order.CouponCode = cleanCouponCode;
                order.TotalAmount = Math.Max(0, order.SubTotal - discountAmount) + order.ShippingFee;

                foreach (var detail in details)
                {
                    if (detail.Quantity <= 0)
                        throw new InvalidOperationException("So luong san pham khong hop le!");

                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product == null)
                        throw new InvalidOperationException($"San pham ID {detail.ProductId} khong ton tai!");
                    if (product.Stock < detail.Quantity)
                        throw new InvalidOperationException($"San pham {product.Name} khong du so luong trong kho!");

                    product.Stock -= detail.Quantity;
                }

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                foreach (var detail in details)
                {
                    detail.OrderId = order.Id;
                    _context.OrderDetails.Add(detail);
                }

                await _context.SaveChangesAsync();
                await ClearCartAsync(userId);
                await transaction.CommitAsync();

                return order.Id;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task UpdateStatusAsync(int id, string status)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                throw new KeyNotFoundException("Khong tim thay don hang");
            if (order.Status == "Cancelled" || order.Status == "Completed")
                throw new InvalidOperationException("Don hang da dong, khong the thay doi trang thai nua!");

            order.Status = status;
            await _context.SaveChangesAsync();
        }

        public async Task<Order> CancelOrderAsync(int id, string reason)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                throw new KeyNotFoundException("Khong tim thay don hang!");
            if (order.Status != "Pending")
                throw new InvalidOperationException("Chi co the huy don hang khi don dang cho xu ly!");

            var details = await _context.OrderDetails.Where(d => d.OrderId == id).ToListAsync();
            foreach (var detail in details)
            {
                var product = await _context.Products.FindAsync(detail.ProductId);
                if (product != null)
                    product.Stock += detail.Quantity;
            }

            order.Status = "Cancelled";
            order.CancelReason = reason.Trim();
            order.CancelledAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return order;
        }

        public async Task DeleteWithDetailsAsync(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                throw new KeyNotFoundException("Khong tim thay don hang de xoa!");

            var details = await _context.OrderDetails.Where(d => d.OrderId == id).ToListAsync();
            if (details.Any())
                _context.OrderDetails.RemoveRange(details);

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
        }

        public async Task<Order> UpdatePendingOrderAsync(int id, PendingOrderUpdateData data)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = await _context.Orders.FindAsync(id);
                if (order == null)
                    throw new KeyNotFoundException("Khong tim thay don hang!");
                if (order.Status != "Pending")
                    throw new InvalidOperationException("Chi co the cap nhat don hang khi don dang cho xu ly!");

                var oldDetails = await _context.OrderDetails.Where(d => d.OrderId == id).ToListAsync();
                foreach (var oldDetail in oldDetails)
                {
                    var product = await _context.Products.FindAsync(oldDetail.ProductId);
                    if (product != null)
                        product.Stock += oldDetail.Quantity;
                }

                decimal newSubTotal = 0;
                foreach (var item in data.Details)
                {
                    if (item.Quantity <= 0)
                        throw new InvalidOperationException("So luong san pham phai lon hon 0!");

                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product == null)
                        throw new InvalidOperationException($"San pham ID {item.ProductId} khong ton tai!");
                    if (product.Stock < item.Quantity)
                        throw new InvalidOperationException($"San pham {product.Name} khong du so luong trong kho!");

                    var detail = oldDetails.FirstOrDefault(d => d.ProductId == item.ProductId);
                    if (detail != null)
                    {
                        detail.Quantity = item.Quantity;
                        detail.UnitPrice = item.UnitPrice;
                    }

                    product.Stock -= item.Quantity;
                    newSubTotal += item.UnitPrice * item.Quantity;
                }

                order.ReceiverName = data.ReceiverName.Trim();
                order.Phone = data.Phone.Trim();
                order.ShippingAddress = data.ShippingAddress.Trim();
                order.OrderNotes = data.OrderNotes;
                order.SubTotal = newSubTotal;
                order.TotalAmount = newSubTotal + order.ShippingFee;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return order;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private async Task ClearCartAsync(string userId)
        {
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
            if (cart == null)
                return;

            var cartItems = await _context.CartItems.Where(i => i.CartId == cart.Id).ToListAsync();
            if (!cartItems.Any())
                return;

            _context.CartItems.RemoveRange(cartItems);
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// OrderDetail Repository using Entity Framework Core
    /// </summary>
    public interface IOrderDetailRepositoryEF : IRepository<OrderDetail>
    {
        Task<List<OrderDetail>> GetByOrderAsync(int orderId);
    }

    public class OrderDetailRepositoryEF : Repository<OrderDetail>, IOrderDetailRepositoryEF
    {
        public OrderDetailRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        public async Task<List<OrderDetail>> GetByOrderAsync(int orderId)
        {
            return await _dbSet
                .Where(od => od.OrderId == orderId)
                .Include(od => od.Product)
                .ToListAsync();
        }
    }

    public class OrderByUserResult
    {
        public int Id { get; set; }
        public DateTime? OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? PaymentMethod { get; set; }
        public string? ReceiverName { get; set; }
        public string? ShippingAddress { get; set; }
        public string? Phone { get; set; }
        public string? OrderNotes { get; set; }
        public string? CancelReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public List<OrderDetailResult> Details { get; set; } = new();
    }

    public class OrderDetailResult
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public bool IsReviewed { get; set; }
    }

    public class OrderAdminResult
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public string CustomerName { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public DateTime? OrderDate { get; set; }
    }

    public class PendingOrderUpdateData
    {
        public string ReceiverName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string ShippingAddress { get; set; } = "";
        public string? OrderNotes { get; set; }
        public List<PendingOrderUpdateDetailData> Details { get; set; } = new();
    }

    public class PendingOrderUpdateDetailData
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
