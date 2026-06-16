using BaseCore.Entities;

namespace BaseCore.Services
{
    public interface IProductReviewService
    {
        Task<ProductReview?> GetByOrderAndProductAsync(int orderId, int productId);
        Task<ProductReview> CreateAsync(ProductReview review);
        Task<List<ProductReview>> GetByProductAsync(int productId);
        Task<List<ProductReviewSummaryResult>> GetSummaryAsync();
    }

    public class ProductReviewSummaryResult
    {
        public int ProductId { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
    }
}
