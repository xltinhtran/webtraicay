using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepositoryEF _productRepository;

        public ProductService(IProductRepositoryEF productRepository)
        {
            _productRepository = productRepository;
        }

        public Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, string? quality, string? stockStatus, int page, int pageSize)
        {
            return _productRepository.SearchAsync(keyword, categoryId, minPrice, maxPrice, quality, stockStatus, page, pageSize);
        }

        public Task<Product?> GetByIdAsync(int id)
        {
            return _productRepository.GetByIdAsync(id);
        }

        public Task<Product> CreateAsync(Product product)
        {
            return _productRepository.AddAsync(product);
        }

        public Task UpdateAsync(Product product)
        {
            return _productRepository.UpdateAsync(product);
        }

        public Task DeleteAsync(Product product)
        {
            return _productRepository.DeleteAsync(product);
        }

        public Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            return _productRepository.GetByCategoryAsync(categoryId);
        }

        public Task<List<Product>> GetFeaturedAsync()
        {
            return _productRepository.GetFeaturedAsync();
        }

        public Task<List<Product>> FilterByNameAsync(string? name)
        {
            return _productRepository.FilterByNameAsync(name);
        }
    }
}
