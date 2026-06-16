using BaseCore.DTO.Reviews;
using BaseCore.Entities;
using BaseCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IProductReviewService _reviewService;
        private readonly IWebHostEnvironment _env;

        public ReviewsController(IProductReviewService reviewService, IWebHostEnvironment env)
        {
            _reviewService = reviewService;
            _env = env;
        }

        [HttpPost("submit")]
        [AllowAnonymous]
        public async Task<IActionResult> SubmitReview([FromForm] SubmitReviewDto reviewDto)
        {
            if (reviewDto == null || !ModelState.IsValid)
                return BadRequest("Du lieu bi loi!");

            try
            {
                var existingReview = await _reviewService.GetByOrderAndProductAsync(reviewDto.OrderId, reviewDto.ProductId);
                if (existingReview != null)
                    return BadRequest("Ban da danh gia san pham nay trong don hang nay roi!");

                string? imagePath = null;
                if (reviewDto.ImageFile != null && reviewDto.ImageFile.Length > 0)
                {
                    var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var uploadsFolder = Path.Combine(webRoot, "img", "reviews");

                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = Guid.NewGuid() + "_" + reviewDto.ImageFile.FileName;
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await reviewDto.ImageFile.CopyToAsync(fileStream);
                    }

                    imagePath = "/img/reviews/" + uniqueFileName;
                }

                var newReview = new ProductReview
                {
                    OrderId = reviewDto.OrderId,
                    ProductId = reviewDto.ProductId,
                    UserName = reviewDto.UserName ?? "Khach hang",
                    UserImage = "/img/avatar.jpg",
                    Rating = reviewDto.Rating,
                    Comment = reviewDto.Comment,
                    ImageUrl = imagePath,
                    ReviewDate = DateTime.Now
                };

                await _reviewService.CreateAsync(newReview);
                return Ok(new { message = "Luu danh gia thanh cong!", data = newReview });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Loi C#: " + ex.Message);
            }
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByProduct(int productId)
        {
            var reviews = await _reviewService.GetByProductAsync(productId);

            var result = reviews.Select(r => new
            {
                id = r.Id,
                productId = r.ProductId,
                orderId = r.OrderId,
                userName = r.UserName,
                userImage = r.UserImage,
                rating = r.Rating,
                comment = r.Comment,
                imageUrl = r.ImageUrl,
                reviewDate = r.ReviewDate
            });

            return Ok(result);
        }

        [HttpGet("summary")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewSummary()
        {
            var summary = await _reviewService.GetSummaryAsync();
            return Ok(summary);
        }
    }
}
