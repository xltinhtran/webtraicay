using BaseCore.DTO.Orders;
using BaseCore.Entities;
using BaseCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IProductService _productService;

        public OrdersController(
            IOrderService orderService,
            IProductService productService)
        {
            _orderService = orderService;
            _productService = productService;
        }

        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOrdersByUserId(string userId)
        {
            try
            {
                var orders = await _orderService.GetOrderHistoryByUserAsync(userId);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loi DB khi tai don hang: {ex.Message}");
            }
        }

        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllOrders([FromQuery] string? keyword)
        {
            try
            {
                var orders = await _orderService.SearchAdminOrdersAsync(keyword);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loi DB: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderService.GetByIdAsync(id);
            if (order == null)
                return NotFound(new { message = "Khong tim thay don hang" });

            var details = await _orderService.GetDetailsByOrderAsync(id);
            return Ok(new { order, details });
        }

        [HttpPost("checkout")]
        [AllowAnonymous]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest("Du lieu dat hang bi rong!");

                if (dto.Details == null || dto.Details.Count == 0)
                    return BadRequest("Gio hang dang trong, khong the dat hang!");

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? dto.UserId;
                if (string.IsNullOrWhiteSpace(userId))
                    return Unauthorized(new { message = "Vui long dang nhap de thanh toan!" });

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

                var details = dto.Details.Select(item => new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                }).ToList();

                var orderId = await _orderService.CheckoutAsync(userId, order, details, dto.CouponCode);

                return Ok(new
                {
                    message = "Luu hoa don va don gio hang thanh cong!",
                    orderId
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                var errorMsg = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, $"Loi Server C#: {errorMsg}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            decimal totalAmount = 0;
            var orderDetails = new List<OrderDetail>();

            foreach (var item in dto.Items)
            {
                var product = await _productService.GetByIdAsync(item.ProductId);
                if (product == null)
                    return BadRequest(new { message = $"Product {item.ProductId} not found" });
                if (product.Stock < item.Quantity)
                    return BadRequest(new { message = $"Insufficient stock for {product.Name}" });

                totalAmount += product.Price * item.Quantity;

                orderDetails.Add(new OrderDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                });

                product.Stock -= item.Quantity;
                await _productService.UpdateAsync(product);
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

            await _orderService.CreateAsync(order);

            foreach (var detail in orderDetails)
            {
                detail.OrderId = order.Id;
                await _orderService.CreateDetailAsync(detail);
            }

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new { order, details = orderDetails });
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            try
            {
                await _orderService.UpdateStatusAsync(id, dto.Status);
                return Ok(new { message = "Cap nhat thanh cong" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
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
                if (string.IsNullOrWhiteSpace(dto.Reason))
                    return BadRequest("Vui long chon ly do huy don!");

                var order = await _orderService.CancelOrderAsync(id, dto.Reason);
                return Ok(new { message = "Huy don hang thanh cong!", order });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loi huy don hang: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            try
            {
                await _orderService.DeleteWithDetailsAsync(id);
                return Ok(new { message = "Da xoa vinh vien don hang va cac chi tiet lien quan!" });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loi server khi xoa: {ex.Message}");
            }
        }

        [HttpGet("filter")]
        [AllowAnonymous]
        public async Task<IActionResult> FilterProducts(string? name, DateTime? startDate)
        {
            var products = await _productService.FilterByNameAsync(name);
            return Ok(products);
        }

        [HttpPut("{id}/pending-update")]
        [AllowAnonymous]
        public async Task<IActionResult> UpdatePendingOrder(int id, [FromBody] UpdatePendingOrderDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.ReceiverName))
                    return BadRequest("Vui long nhap ten nguoi nhan!");
                if (string.IsNullOrWhiteSpace(dto.Phone))
                    return BadRequest("Vui long nhap so dien thoai!");
                if (string.IsNullOrWhiteSpace(dto.ShippingAddress))
                    return BadRequest("Vui long nhap dia chi giao hang!");

                var data = new OrderPendingUpdateData
                {
                    ReceiverName = dto.ReceiverName,
                    Phone = dto.Phone,
                    ShippingAddress = dto.ShippingAddress,
                    OrderNotes = dto.OrderNotes,
                    Details = dto.Details.Select(item => new OrderPendingUpdateDetailData
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    }).ToList()
                };

                var order = await _orderService.UpdatePendingOrderAsync(id, data);
                return Ok(new { message = "Cap nhat don hang thanh cong!", order });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loi cap nhat don hang: {ex.Message}");
            }
        }

    }
}
