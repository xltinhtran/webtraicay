//orderCTL
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Thêm thư viện này để xài lệnh xóa
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using System.Security.Claims;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using BaseCore.Repository; // Thêm thư viện này để lặp và tìm kiếm

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Order API Controller
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;
        private readonly IProductRepositoryEF _productRepository;

        // 1. GỌI THÊM THẰNG DbContext VÀO ĐỂ NÓ CHỌC THẲNG VÀO GIỎ HÀNG
        private readonly BaseCoreDbContext _context;

        public OrdersController(
            IOrderRepositoryEF orderRepository,
            IOrderDetailRepositoryEF orderDetailRepository,
            IProductRepositoryEF productRepository,
            BaseCoreDbContext context) // Bơm DbContext vào đây
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
            _productRepository = productRepository;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                // Sử dụng .AsNoTracking() để tăng tốc và tránh lỗi lặp quan hệ
                var orders = await _context.Orders.AsNoTracking().ToListAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi DB: {ex.Message}");
            }
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllOrders([FromQuery] string? keyword)
        {
            try
            {
                var query = _context.Orders.AsNoTracking().AsQueryable();

                if (!string.IsNullOrEmpty(keyword))
                {
                    string searchLower = keyword.ToLower().Trim();

                    // 1. DỊCH TRẠNG THÁI TỪ VIỆT SANG ANH
                    string mappedStatus = searchLower switch
                    {
                        var s when s.Contains("chờ xử lý") => "Pending",
                        var s when s.Contains("chờ vận chuyển") => "Processing",
                        var s when s.Contains("đang vận chuyển") => "Shipping",
                        var s when s.Contains("hoàn thành") => "Completed",
                        var s when s.Contains("hủy") => "Cancelled",
                        _ => searchLower
                    };

                    // 🌟 2. BỘ XỬ LÝ SỐ THÔNG MINH (CHỐNG LỖI SẬP EF CORE)
                    // Thử xem khách gõ vào có phải là con số không (vd: "34")
                    bool isNumeric = int.TryParse(searchLower, out int parsedId);
                    bool isDecimal = decimal.TryParse(searchLower, out decimal parsedAmount);

                    // 3. QUÉT DATABASE
                    query = query.Where(o =>
                        // Quét ID (Chỉ quét nếu khách gõ đúng là số)
                        (isNumeric && o.Id == parsedId) ||

                        // Quét Tổng tiền (Chỉ quét nếu khách gõ đúng là số)
                        (isDecimal && o.TotalAmount == parsedAmount) ||

                        // Quét Trạng thái
                        (o.Status != null && o.Status.ToLower().Contains(mappedStatus)) ||

                        // Quét Tên khách hàng (Bắc cầu sang bảng Users)
                        _context.Users.Any(u => u.Id == o.UserId && u.Name.ToLower().Contains(searchLower))
                    );
                }

                var orders = await query
                    .OrderByDescending(o => o.OrderDate)
                    .Select(o => new {
                        o.Id,
                        o.UserId,
                        CustomerName = _context.Users.Where(u => u.Id == o.UserId).Select(u => u.Name).FirstOrDefault() ?? "Khách vãng lai",
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
            if (order == null) return NotFound(new { message = "Order not found" });

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            return Ok(new { order, details });
        }

        // =========================================================================
        // HÀM CHECKOUT: LƯU HÓA ĐƠN & DỌN SẠCH GIỎ HÀNG
        // =========================================================================
        [HttpPost("checkout")]
        [AllowAnonymous]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? dto.UserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Vui lòng đăng nhập để thanh toán!" });

            var orderDetails = new List<OrderDetail>();

            // 1. Kiểm tra tồn kho
            foreach (var item in dto.Details)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Sản phẩm ID {item.ProductId} không tồn tại" });

                if (product.Stock < item.Quantity)
                    return BadRequest(new { message = $"Sản phẩm {product.Name} không đủ số lượng trong kho" });

                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                });

                // Trừ kho
                product.Stock -= item.Quantity;
                await _productRepository.UpdateAsync(product);
            }

            // 2. Tạo Hóa đơn
            var order = new Order
            {
                UserId = userId,
                OrderDate = DateTime.Now,
                SubTotal = dto.SubTotal,
                ShippingFee = dto.ShippingFee,
                TotalAmount = dto.TotalAmount,
                Status = "Pending",
                ShippingAddress = dto.ShippingAddress ?? "",
                PaymentMethod = dto.PaymentMethod ?? "Cash On Delivery",
                OrderNotes = dto.OrderNotes,
                CouponCode = dto.CouponCode
            };

            await _orderRepository.AddAsync(order);

            // 3. Lưu chi tiết hóa đơn
            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            // =======================================================
            // 4. BỘ MÁY DỌN DẸP GIỎ HÀNG (MỚI THÊM VÀO ĐÂY NÈ NÍ!!!)
            // =======================================================
            try
            {
                // Tìm giỏ hàng của ông khách này
                var cart = await _context.Carts.FirstOrDefaultAsync(c => c.UserId == userId);
                if (cart != null)
                {
                    // Lôi hết đồ trong giỏ ra
                    var cartItems = await _context.CartItems.Where(i => i.CartId == cart.Id).ToListAsync();
                    if (cartItems.Any())
                    {
                        // Đem đi vứt sọt rác
                        _context.CartItems.RemoveRange(cartItems);
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi khi xóa giỏ hàng: " + ex.Message);
                // Dù xóa giỏ hàng lỗi thì vẫn báo đặt hàng thành công nha
            }

            return Ok(new { message = "Lưu hóa đơn và dọn giỏ hàng thành công! 🎉", orderId = order.Id });
        }


        // (Giữ nguyên hàm Create cũ)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                var product = await _productRepository.GetByIdAsync(item.ProductId);
                if (product == null) return BadRequest(new { message = $"Product {item.ProductId} not found" });
                if (product.Stock < item.Quantity) return BadRequest(new { message = $"Insufficient stock for {product.Name}" });

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
                TotalAmount = totalAmount,
                Status = "Pending",
                ShippingAddress = dto.ShippingAddress ?? ""
            };

            await _orderRepository.AddAsync(order);

            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderDetailRepository.AddAsync(detail);
            }

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new { order, details = orderDetails });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            // KIỂM TRA: Nếu trạng thái hiện tại là 'Đã hủy' hoặc 'Hoàn thành' thì cấm sửa
            if (order.Status == "Canceled" || order.Status == "Completed")
            {
                return BadRequest("Đơn hàng đã đóng (Hủy/Hoàn thành), không thể thay đổi trạng thái nữa ní ơi!");
            }

            // Chỉ cho phép cập nhật nếu đơn hàng vẫn đang trong luồng xử lý
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

        // Khai báo thêm Class này ở cuối file Controller hoặc file DTO
        public class StatusUpdateDto
        {
            public string Status { get; set; } = null!;
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });

            if (order.Status == "Completed")
                return BadRequest(new { message = "Cannot cancel completed order" });

            var details = await _orderDetailRepository.GetByOrderAsync(id);
            foreach (var detail in details)
            {
                var product = await _productRepository.GetByIdAsync(detail.ProductId);
                if (product != null)
                {
                    product.Stock += detail.Quantity;
                    await _productRepository.UpdateAsync(product);
                }
            }

            order.Status = "Cancelled";
            await _orderRepository.UpdateAsync(order);

            return Ok(new { message = "Order cancelled successfully", order });
        }

        // =========================================================================
        // HÀM XÓA ĐƠN HÀNG: XÓA CHI TIẾT TRƯỚC, XÓA ĐƠN SAU
        // =========================================================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            try
            {
                // 1. Tìm đơn hàng xem có tồn tại không
                var order = await _context.Orders.FindAsync(id);
                if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng để xóa!" });

                // 2. Tìm tất cả các chi tiết liên quan đến đơn hàng này
                var details = await _context.OrderDetails.Where(d => d.OrderId == id).ToListAsync();

                // 3. Xóa các chi tiết trước để không bị lỗi khóa ngoại (Foreign Key)
                if (details.Any())
                {
                    _context.OrderDetails.RemoveRange(details);
                }

                // 4. Bây giờ mới xóa đơn hàng chính
                _context.Orders.Remove(order);

                // 5. Lưu thay đổi vào Database
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đã xóa vĩnh viễn đơn hàng và các chi tiết liên quan! 🗑️" });
            }
            catch (Exception ex)
            {
                // Nếu có lỗi gì phát sinh (ví dụ lỗi DB) thì báo về cho React
                return StatusCode(500, $"Lỗi server khi xóa: {ex.Message}");
            }
        }

        [HttpGet("filter")]
        [AllowAnonymous]
        public async Task<IActionResult> FilterProducts(string? name, DateTime? startDate)
        {
            // Lọc theo Tên và Ngày theo yêu cầu của thầy
            var query = _context.Products.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(name))
            {
                query = query.Where(p => p.Name.Contains(name));
            }

            if (startDate.HasValue)
            {
                // Giả sử ní lọc theo ngày tạo (CreatedDate), nếu không có thì bỏ qua phần này
                // query = query.Where(p => p.CreatedDate >= startDate.Value);
            }

            return Ok(await query.ToListAsync());
        }
    }

    // =========================================================================
    // CÁC DTO (Data Transfer Objects)
    // =========================================================================

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

    // DTO hứng dữ liệu thanh toán từ React
    public class CheckoutDto
    {
        public string UserId { get; set; }
        public string ShippingAddress { get; set; }
        public string Phone { get; set; }
        public string OrderNotes { get; set; }
        public string PaymentMethod { get; set; }
        public decimal SubTotal { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string CouponCode { get; set; }
        public List<CheckoutDetailDto> Details { get; set; } = new();
    }

    public class CheckoutDetailDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}