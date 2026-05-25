using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly BaseCoreDbContext _context;

        public CartsController(BaseCoreDbContext context)
        {
            _context = context;
        }

        // 1. API THÊM VÀO GIỎ HÀNG
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            // Tìm xem khách này có giỏ hàng chưa?
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == request.UserId);

            // Chưa có thì tạo cái giỏ mới tinh
            if (cart == null)
            {
                cart = new Cart { UserId = request.UserId, CartItems = new List<CartItem>() };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // Kiểm tra xem món này đã có trong giỏ chưa?
            var existingItem = cart.CartItems.FirstOrDefault(i => i.ProductId == request.ProductId);
            if (existingItem != null)
            {
                existingItem.Quantity += request.Quantity; // Có rồi thì cộng dồn số lượng
            }
            else
            {
                // Chưa có thì nhét món mới vào
                _context.CartItems.Add(new CartItem
                {
                    CartId = cart.Id,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã lưu vào SQL Server thành công!" });
        }

        // 2. API LẤY GIỎ HÀNG RA XEM
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetCart(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(i => i.Product) // Móc luôn cục Product (Tên, Ảnh, Giá) ra
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return Ok(new List<object>()); // Trống trơn

            // Gói ghém dữ liệu cho đẹp để gửi về React
            var result = cart.CartItems.Select(i => new {
                Id = i.Id,           // ID của CartItem (để lát xóa)
                ProductId = i.ProductId,
                Name = i.Product.Name,
                ImageUrl = i.Product.ImageUrl,
                Price = i.Product.Price,
                DiscountPrice = i.Product.DiscountPrice,
                Quantity = i.Quantity
            });

            return Ok(result);
        }
        // 3. API XÓA MÓN HÀNG KHỎI GIỎ
        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            // Tìm món hàng trong CSDL dựa vào ID
            var cartItem = await _context.CartItems.FindAsync(cartItemId);

            if (cartItem == null)
            {
                return NotFound(new { message = "Không tìm thấy món hàng này để xóa!" });
            }

            // Chém nó khỏi bảng CartItems
            _context.CartItems.Remove(cartItem);

            // Lưu lại thay đổi xuống SQL
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã tiễn ẻm bay màu khỏi SQL Server!" });
        }
    }

    public class AddToCartRequest
    {
        public string UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}