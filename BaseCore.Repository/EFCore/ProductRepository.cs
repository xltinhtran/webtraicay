using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;

namespace BaseCore.Repository.EFCore
{
    /// <summary>
    /// Product Repository using Entity Framework Core
    /// </summary>
    public interface IProductRepositoryEF : IRepository<Product>
    {
        Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, string? quality, string? stockStatus, int page, int pageSize);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
        Task<List<Product>> GetFeaturedAsync();
        Task<List<Product>> FilterByNameAsync(string? name);
    }

    public class ProductRepositoryEF : Repository<Product>, IProductRepositoryEF
    {
        // Đã đổi MySqlDbContext thành BaseCoreDbContext
        public ProductRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        public async Task<(List<Product> Products, int TotalCount)> SearchAsync(string? keyword, int? categoryId, decimal? minPrice, decimal? maxPrice, string? quality, string? stockStatus, int page, int pageSize)
        {
            var query = _dbSet.Include(p => p.Category).AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                keyword = keyword.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(keyword));
            }

            if (categoryId.HasValue && categoryId > 0)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }

            if (minPrice.HasValue && minPrice.Value >= 0)
            {
                query = query.Where(p => p.Price >= minPrice.Value);
            }

            if (maxPrice.HasValue && maxPrice.Value >= 0)
            {
                query = query.Where(p => p.Price <= maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(quality))
            {
                var normalizedQuality = quality.Trim().ToLower();
                if (normalizedQuality == "sales" || normalizedQuality == "discount")
                {
                    query = query.Where(p =>
                        (p.Quality ?? "").ToLower() == "sales" ||
                        (p.Quality ?? "").ToLower() == "discount" ||
                        (p.DiscountPrice.HasValue && p.DiscountPrice.Value > 0));
                }
                else
                {
                    query = query.Where(p => (p.Quality ?? "").ToLower() == normalizedQuality);
                }
            }

            if (!string.IsNullOrWhiteSpace(stockStatus))
            {
                var normalizedStockStatus = stockStatus.Trim().ToLower();

                if (normalizedStockStatus == "out")
                {
                    query = query.Where(p => p.Stock <= 0);
                }
                else if (normalizedStockStatus == "low")
                {
                    query = query.Where(p => p.Stock > 0 && p.Stock <= p.LowStockThreshold);
                }
                else if (normalizedStockStatus == "available")
                {
                    query = query.Where(p => p.Stock > p.LowStockThreshold);
                }
            }

            var totalCount = await query.CountAsync();

            var products = await query
                .OrderByDescending(p => p.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (products, totalCount);
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Where(p => p.CategoryId == categoryId)
                .Include(p => p.Category)
                .ToListAsync();
        }

        public async Task<List<Product>> GetFeaturedAsync()
        {
            return await _dbSet
                .Where(p => p.IsFeatured)
                .ToListAsync();
        }

        public async Task<List<Product>> FilterByNameAsync(string? name)
        {
            var query = _dbSet.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(name))
            {
                query = query.Where(p => p.Name.Contains(name));
            }

            return await query.ToListAsync();
        }
    }
}
