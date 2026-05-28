using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;
        private readonly IProductRepositoryEF _productRepository;
        private readonly BaseCoreDbContext _context;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository,
            BaseCoreDbContext context)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _context = context;
        }

        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOrdersByUserId(string userId)
        {
            try
            {
                var orders = await _context.Orders
                    .Where(o => o.UserId == userId)
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderDate,
                        o.TotalAmount,
                        o.Status,
                        o.PaymentMethod,
                        o.ReceiverName,
                        o.ShippingAddress,
                        o.Phone,
                        o.OrderNotes,
                        o.CancelReason,
                        o.CancelledAt,
                        Details = _context.OrderDetails
                             .Where(od => od.OrderId == o.Id)
                             .Select(od => new
                              {
                                  od.ProductId,
                                ProductName = _context.Products
                                 .Where(p => p.Id == od.ProductId)
                                 .Select(p => p.Name)
                                 .FirstOrDefault(),

                               ProductImageUrl = _context.Products
                                  .Where(p => p.Id == od.ProductId)
                                  .Select(p => p.ImageUrl)
                                   .FirstOrDefault(),

                                od.Quantity,
                                od.UnitPrice,

                                 IsReviewed = _context.ProductReviews
                                       .Any(r => r.OrderId == o.Id && r.ProductId == od.ProductId)
                                  }) .ToList()
                    })
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi DB khi tải đơn hàng: {ex.Message}");
            }
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllOrders([FromQuery] string? keyword)
        {
            try
            {
                var query = _context.Orders.AsNoTracking().AsQueryable();

                if (!string.IsNullOrWhiteSpace(keyword))
                {
                    string searchLower = keyword.ToLower().Trim();

                    string mappedStatus = searchLower switch
                    {
                        var s when s.Contains("chờ xử lý") => "Pending",
                        var s when s.Contains("chờ vận chuyển") => "Processing",
                        var s when s.Contains("đang vận chuyển") => "Shipping",
                        var s when s.Contains("hoàn thành") => "Completed",
                        var s when s.Contains("hủy") => "Cancelled",
                        _ => searchLower
                    };

                    bool isNumeric = int.TryParse(searchLower, out int parsedId);
                    bool isDecimal = decimal.TryParse(searchLower, out decimal parsedAmount);

                    query = query.Where(o =>
                        (isNumeric && o.Id == parsedId) ||
                        (isDecimal && o.TotalAmount == parsedAmount) ||
                        (o.Status != null && o.Status.ToLower().Contains(mappedStatus)) ||
                        _context.Users.Any(u => u.Id == o.UserId && u.Name.ToLower().Contains(searchLower))
                    );
                }

                var orders = await query
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => new
                    {
                        o.Id,
                        o.UserId,
                        CustomerName = _context.Users
                            .Where(u => u.Id == o.UserId)
                            .Select(u => u.Name)
                            .FirstOrDefault() ?? "Khách vãng lai",
                        o.TotalAmount,
                        o.Status,
                        o.OrderDate
                    })
                    .ToListAsync();

                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi DB: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);

            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            var details = await _orderDetailRepository.GetByOrderAsync(id);

            return Ok(new { order, details });
        }

        [HttpPost("checkout")]
        [AllowAnonymous]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (dto == null)
                {
                    return BadRequest("Dữ liệu đặt hàng bị rỗng!");
                }

                if (dto.Details == null || dto.Details.Count == 0)
                {
                    return BadRequest("Giỏ hàng đang trống, không thể đặt hàng!");
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? dto.UserId;

                if (string.IsNullOrWhiteSpace(userId))
                {
                    return Unauthorized(new { message = "Vui lòng đăng nhập để thanh toán!" });
                }

                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);

                if (!userExists)
                {
                    return BadRequest("Tài khoản đặt hàng không tồn tại trong hệ thống!");
                }

                var cleanCouponCode = string.IsNullOrWhiteSpace(dto.CouponCode)
                    ? null
                    : dto.CouponCode.Trim().ToUpper();

                if (cleanCouponCode != null)
                {
                    var coupon = await _context.Coupons
                        .FirstOrDefaultAsync(c => c.Code == cleanCouponCode);

                    if (coupon == null)
                    {
                        return BadRequest("Mã giảm giá không tồn tại!");
                    }

                    if (!coupon.IsActive)
                    {
                        return BadRequest("Mã giảm giá này đã bị khóa!");
                    }

                    if (coupon.ExpiryDate < DateTime.Now)
                    {
                        return BadRequest("Mã giảm giá này đã hết hạn!");
                    }
                }

                var orderDetails = new List<OrderDetail>();

                foreach (var item in dto.Details)
                {
                    if (item.Quantity <= 0)
                    {
                        return BadRequest("Số lượng sản phẩm không hợp lệ!");
                    }

                    var product = await _context.Products.FindAsync(item.ProductId);

                    if (product == null)
                    {
                        return BadRequest($"Sản phẩm ID {item.ProductId} không tồn tại!");
                    }

                    if (product.Stock < item.Quantity)
                    {
                        return BadRequest($"Sản phẩm {product.Name} không đủ số lượng trong kho!");
                    }

                    orderDetails.Add(new OrderDetail
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    });

                    product.Stock -= item.Quantity;
                }
                var order = new Order
                {
                    UserId = userId,
                    OrderDate = DateTime.Now,
                    SubTotal = dto.SubTotal,
                    ShippingFee = dto.ShippingFee,
                    TotalAmount = dto.TotalAmount,
                    Status = "Pending",
                    ReceiverName = dto.ReceiverName,
                    ShippingAddress = dto.ShippingAddress ?? "",
                    Phone = dto.Phone,
                    PaymentMethod = dto.PaymentMethod ?? "Cash On Delivery",
                    OrderNotes = dto.OrderNotes,
                    CouponCode = string.IsNullOrWhiteSpace(dto.CouponCode) ? null : dto.CouponCode.Trim().ToUpper()
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                foreach (var detail in orderDetails)
                {
                    detail.OrderId = order.Id;
                    _context.OrderDetails.Add(detail);
                }

                await _context.SaveChangesAsync();

                var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);

                if (cart != null)
                {
                    var cartItems = await _context.CartItems
                        .Where(i => i.CartId == cart.Id)
                        .ToListAsync();

                    if (cartItems.Any())
                    {
                        _context.CartItems.RemoveRange(cartItems);
                        await _context.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Lưu hóa đơn và dọn giỏ hàng thành công! 🎉",
                    orderId = order.Id
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                var errorMsg = ex.InnerException != null
                    ? ex.InnerException.Message
                    : ex.Message;

                return StatusCode(500, $"Lỗi Server C#: {errorMsg}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);

                if (product == null)
                {
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });
                }

                if (product.Stock < item.Quantity)
                {
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}" });
                }

                totalAmount += product.Price * item.Quantity;

                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                });

                product.Stock -= item.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                SubTotal = totalAmount,
                ShippingFee = 0,
                TotalAmount = totalAmount,
                Status = "Pending",
                ShippingAddress = dto.ShippingAddress ?? "",
                PaymentMethod = "Cash On Delivery",
                CouponCode = null
            };

            await _orderRepository.AddAsync(order);

            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            return CreatedAtAction(
                nameof(GetById),
                new { id = order.Id },
                new { order, details = orderDetails }
            );
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            var order = await _context.Orders.FindAsync(id);

            if (order == null)
            {
                return NotFound();
            }

            if (order.Status == "Cancelled" || order.Status == "Completed")
            {
                return BadRequest("Đơn hàng đã đóng (Hủy/Hoàn thành), không thể thay đổi trạng thái nữa ní ơi!");
            }

            order.Status = dto.Status;

            try
            {
                await _context.SaveChangesAsync();

                return Ok(new { message = "Cập nhật thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPut("{id}/cancel")]
        [AllowAnonymous]
        public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelOrderDto dto)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);

                if (order == null)
                {
                    return NotFound("Không tìm thấy đơn hàng!");
                }

                if (order.Status != "Pending")
                {
                    return BadRequest("Chỉ có thể hủy đơn hàng khi đơn đang chờ xử lý!");
                }

                if (string.IsNullOrWhiteSpace(dto.Reason))
                {
                    return BadRequest("Vui lòng chọn lý do hủy đơn!");
                }

                var details = await _context.OrderDetails
                    .Where(d => d.OrderId == id)
                    .ToListAsync();

                foreach (var detail in details)
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);

                    if (product != null)
                    {
                        product.Stock += detail.Quantity;
                    }
                }

                order.Status = "Cancelled";
                order.CancelReason = dto.Reason.Trim();
                order.CancelledAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Hủy đơn hàng thành công!",
                    order
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi hủy đơn hàng: {ex.Message}");
            }
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            try
            {
                var order = await _context.Orders.FindAsync(id);

                if (order == null)
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng để xóa!" });
                }

                var details = await _context.OrderDetails
                    .Where(d => d.OrderId == id)
                    .ToListAsync();

                if (details.Any())
                {
                    _context.OrderDetails.RemoveRange(details);
                }

                _context.Orders.Remove(order);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa vĩnh viễn đơn hàng và các chi tiết liên quan! 🗑️" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server khi xóa: {ex.Message}");
            }
        }

        [HttpGet("filter")]
        [AllowAnonymous]
        public async Task<IActionResult> FilterProducts(string? name, DateTime? startDate)
        {
            var query = _context.Products.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(name))
            {
                query = query.Where(p => p.Name.Contains(name));
            }

            return Ok(await query.ToListAsync());
        }

        public class StatusUpdateDto
        {
            public string Status { get; set; } = null!;
        }
        [HttpPut("{id}/pending-update")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdatePendingOrder(int id, [FromBody] UpdatePendingOrderDto dto)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = await _context.Orders.FindAsync(id);

                if (order == null)
                {
                    return NotFound("Không tìm thấy đơn hàng!");
                }

                if (order.Status != "Pending")
                {
                    return BadRequest("Chỉ có thể cập nhật đơn hàng khi đơn đang chờ xử lý!");
                }

                if (string.IsNullOrWhiteSpace(dto.ReceiverName))
                {
                    return BadRequest("Vui lòng nhập tên người nhận!");
                }

                if (string.IsNullOrWhiteSpace(dto.Phone))
                {
                    return BadRequest("Vui lòng nhập số điện thoại!");
                }

                if (string.IsNullOrWhiteSpace(dto.ShippingAddress))
                {
                    return BadRequest("Vui lòng nhập địa chỉ giao hàng!");
                }

                var oldDetails = await _context.OrderDetails
                    .Where(d => d.OrderId == id)
                    .ToListAsync();

                foreach (var oldDetail in oldDetails)
                {
                    var product = await _context.Products.FindAsync(oldDetail.ProductId);

                    if (product != null)
                    {
                        product.Stock += oldDetail.Quantity;
                    }
                }

                decimal newSubTotal = 0;

                foreach (var item in dto.Details)
                {
                    if (item.Quantity <= 0)
                    {
                        return BadRequest("Số lượng sản phẩm phải lớn hơn 0!");
                    }

                    var product = await _context.Products.FindAsync(item.ProductId);

                    if (product == null)
                    {
                        return BadRequest($"Sản phẩm ID {item.ProductId} không tồn tại!");
                    }

                    if (product.Stock < item.Quantity)
                    {
                        return BadRequest($"Sản phẩm {product.Name} không đủ số lượng trong kho!");
                    }

                    var detail = oldDetails.FirstOrDefault(d => d.ProductId == item.ProductId);

                    if (detail != null)
                    {
                        detail.Quantity = item.Quantity;
                        detail.UnitPrice = item.UnitPrice;
                    }

                    product.Stock -= item.Quantity;
                    newSubTotal += item.UnitPrice * item.Quantity;
                }

                order.ReceiverName = dto.ReceiverName.Trim();
                order.Phone = dto.Phone.Trim();
                order.ShippingAddress = dto.ShippingAddress.Trim();
                order.OrderNotes = dto.OrderNotes;
                order.SubTotal = newSubTotal;
                order.TotalAmount = newSubTotal + order.ShippingFee;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Cập nhật đơn hàng thành công!",
                    order
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Lỗi cập nhật đơn hàng: {ex.Message}");
            }
        }
    }

    public class CreateOrderDto
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public string? ShippingAddress { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
    }

    public class CheckoutDto
    {
        public string? UserId { get; set; }
        public string? ShippingAddress { get; set; }
        public string? Phone { get; set; }
        public string? OrderNotes { get; set; }
        public string? PaymentMethod { get; set; }
        public decimal SubTotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }

        // Quan trọng: nullable để không nhập mã giảm giá vẫn đặt hàng được
        public string? CouponCode { get; set; }
        public string? ReceiverName { get; set; }

        public List<CheckoutDetailDto> Details { get; set; } = new();
    }

    public class CheckoutDetailDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
public class CancelOrderDto
{
    public string? Reason { get; set; }
}
public class UpdatePendingOrderDto
{
    public string? ReceiverName { get; set; }
    public string? Phone { get; set; }
    public string? ShippingAddress { get; set; }
    public string? OrderNotes { get; set; }
    public List<UpdatePendingOrderDetailDto> Details { get; set; } = new();
}
public class UpdatePendingOrderDetailDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}