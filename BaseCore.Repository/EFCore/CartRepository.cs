using BaseCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.EFCore
{
    public interface ICartRepositoryEF
    {
        Task AddToCartAsync(string userId, int productId, int quantity);
        Task<List<CartItem>> GetItemsByUserAsync(string userId);
        Task<CartItem?> GetItemByIdAsync(int cartItemId);
        Task DeleteItemAsync(CartItem cartItem);
    }

    public class CartRepositoryEF : ICartRepositoryEF
    {
        private readonly BaseCoreDbContext _context;

        public CartRepositoryEF(BaseCoreDbContext context)
        {
            _context = context;
        }

        public async Task AddToCartAsync(string userId, int productId, int quantity)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart { UserId = userId, CartItems = new List<CartItem>() };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            var existingItem = cart.CartItems.FirstOrDefault(i => i.ProductId == productId);
            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
            }
            else
            {
                _context.CartItems.Add(new CartItem
                {
                    CartId = cart.Id,
                    ProductId = productId,
                    Quantity = quantity
                });
            }

            await _context.SaveChangesAsync();
        }

        public async Task<List<CartItem>> GetItemsByUserAsync(string userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            return cart?.CartItems.ToList() ?? new List<CartItem>();
        }

        public async Task<CartItem?> GetItemByIdAsync(int cartItemId)
        {
            return await _context.CartItems.FindAsync(cartItemId);
        }

        public async Task DeleteItemAsync(CartItem cartItem)
        {
            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();
        }
    }
}
