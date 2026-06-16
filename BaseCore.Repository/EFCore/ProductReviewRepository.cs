using BaseCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.EFCore
{
    public interface IProductReviewRepositoryEF : IRepository<ProductReview>
    {
        Task<ProductReview?> GetByOrderAndProductAsync(int orderId, int productId);
        Task<List<ProductReview>> GetByProductAsync(int productId);
        Task<List<ProductReviewSummary>> GetSummaryAsync();
    }

    public class ProductReviewRepositoryEF : Repository<ProductReview>, IProductReviewRepositoryEF
    {
        public ProductReviewRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        public async Task<ProductReview?> GetByOrderAndProductAsync(int orderId, int productId)
        {
            return await _dbSet.FirstOrDefaultAsync(r => r.OrderId == orderId && r.ProductId == productId);
        }

        public async Task<List<ProductReview>> GetByProductAsync(int productId)
        {
            return await _dbSet
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.ReviewDate)
                .ToListAsync();
        }

        public async Task<List<ProductReviewSummary>> GetSummaryAsync()
        {
            return await _dbSet
                .GroupBy(r => r.ProductId)
                .Select(g => new ProductReviewSummary
                {
                    ProductId = g.Key,
                    AverageRating = Math.Round(g.Average(r => r.Rating), 1),
                    ReviewCount = g.Count()
                })
                .ToListAsync();
        }
    }

    public class ProductReviewSummary
    {
        public int ProductId { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }
}
