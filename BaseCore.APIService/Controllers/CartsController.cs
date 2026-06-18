using BaseCore.DTO.Carts;
using BaseCore.Services;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartsController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            await _cartService.AddToCartAsync(request.UserId, request.ProductId, request.Quantity);
            return Ok(new { message = "Da luu vao SQL Server thanh cong!" });
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetCart(string userId)
        {
            var cartItems = await _cartService.GetItemsByUserAsync(userId);

            var result = cartItems.Select(i => new
            {
                Id = i.Id,
                ProductId = i.ProductId,
                Name = i.Product.Name,
                ImageUrl = i.Product.ImageUrl,
                Price = i.Product.Price,
                DiscountPrice = i.Product.DiscountPrice,
                Unit = i.Product.Unit,
                Stock = i.Product.Stock,
                Quantity = i.Quantity
            });

            return Ok(result);
        }

        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            var cartItem = await _cartService.GetItemByIdAsync(cartItemId);

            if (cartItem == null)
                return NotFound(new { message = "Khong tim thay mon hang nay de xoa!" });

            await _cartService.DeleteItemAsync(cartItem);
            return Ok(new { message = "Da xoa san pham khoi gio hang!" });
        }
    }

}
