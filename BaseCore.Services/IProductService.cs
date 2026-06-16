using BaseCore.Entities;

namespace BaseCore.Services
{
    public interface IProductService
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, string? quality, string? stockStatus, int page, int pageSize);
        Task<Product?> GetByIdAsync(int id);
        Task<Product> CreateAsync(Product product);
        Task UpdateAsync(Product product);
        Task DeleteAsync(Product product);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
        Task<List<Product>> GetFeaturedAsync();
        Task<List<Product>> FilterByNameAsync(string? name);
    }
}
