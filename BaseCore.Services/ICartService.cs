using BaseCore.Entities;

namespace BaseCore.Services
{
    public interface ICartService
    {
        Task AddToCartAsync(string userId, int productId, int quantity);
        Task<List<CartItem>> GetItemsByUserAsync(string userId);
        Task<CartItem?> GetItemByIdAsync(int cartItemId);
        Task DeleteItemAsync(CartItem cartItem);
    }
}
