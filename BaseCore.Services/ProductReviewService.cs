using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Services
{
    public class ProductReviewService : IProductReviewService
    {
        private readonly IProductReviewRepositoryEF _reviewRepository;

        public ProductReviewService(IProductReviewRepositoryEF reviewRepository)
        {
            _reviewRepository = reviewRepository;
        }

        public Task<ProductReview?> GetByOrderAndProductAsync(int orderId, int productId)
        {
            return _reviewRepository.GetByOrderAndProductAsync(orderId, productId);
        }

        public Task<ProductReview> CreateAsync(ProductReview review)
        {
            return _reviewRepository.AddAsync(review);
        }

        public Task<List<ProductReview>> GetByProductAsync(int productId)
        {
            return _reviewRepository.GetByProductAsync(productId);
        }

        public async Task<List<ProductReviewSummaryResult>> GetSummaryAsync()
        {
            var summaries = await _reviewRepository.GetSummaryAsync();

            return summaries.Select(s => new ProductReviewSummaryResult
            {
                ProductId = s.ProductId,
                AverageRating = s.AverageRating,
                ReviewCount = s.ReviewCount
            }).ToList();
        }
    }
}
