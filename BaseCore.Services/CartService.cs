using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Services
{
    public class CartService : ICartService
    {
        private readonly ICartRepositoryEF _cartRepository;

        public CartService(ICartRepositoryEF cartRepository)
        {
            _cartRepository = cartRepository;
        }

        public Task AddToCartAsync(string userId, int productId, int quantity)
        {
            return _cartRepository.AddToCartAsync(userId, productId, quantity);
        }

        public Task<List<CartItem>> GetItemsByUserAsync(string userId)
        {
            return _cartRepository.GetItemsByUserAsync(userId);
        }

        public Task<CartItem?> GetItemByIdAsync(int cartItemId)
        {
            return _cartRepository.GetItemByIdAsync(cartItemId);
        }

        public Task DeleteItemAsync(CartItem cartItem)
        {
            return _cartRepository.DeleteItemAsync(cartItem);
        }
    }
}
