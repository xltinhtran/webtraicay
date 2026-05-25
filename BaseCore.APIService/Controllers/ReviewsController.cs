using BaseCore.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using BaseCore.Entities;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        
        private readonly BaseCoreDbContext _context;

        public ReviewsController(BaseCoreDbContext context)
        {
            _context = context;
        }

        // 1. API HỨNG DỮ LIỆU TỪ REACT (Khớp với bảng ProductReviews)
        [HttpPost]
        public async Task<IActionResult> PostReview([FromBody] ReviewDto reviewDto)
        {
            if (reviewDto == null || !ModelState.IsValid)
            {
                return BadRequest(new { message = "Dữ liệu bị lỗi rùi ní ơi!" });
            }

            try
            {
                // Ép dữ liệu từ React vào đúng các cột trong bảng ProductReviews của ní
                var newReview = new ProductReview
                {
                    ProductId = reviewDto.ProductId,
                    UserName = reviewDto.Name,          // Lấy Tên
                    UserImage = "/img/avatar.jpg",      // Lấy ảnh mặc định
                    Comment = reviewDto.Content,        // Lấy Nội dung đánh giá
                    Rating = reviewDto.Rating,          // Lấy số Sao
                    ReviewDate = DateTime.Now           // Lấy ngày giờ hiện tại
                };

                _context.ProductReviews.Add(newReview);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Lưu đánh giá thành công!", data = newReview });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi C#: " + ex.Message });
            }
        }

        // 2. API LẤY DANH SÁCH ĐÁNH GIÁ (Để sau này show lên web)
        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetReviewsByProduct(int productId)
        {
            var reviews = await _context.ProductReviews
                                .Where(r => r.ProductId == productId)
                                .OrderByDescending(r => r.ReviewDate)
                                .ToListAsync();

            return Ok(reviews);
        }
    }

    // --- CÁC CLASS HỖ TRỢ ---

    // DTO: Cái rổ hứng dữ liệu từ file ShopDetail.jsx (React) gửi qua
    public class ReviewDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; }
        public string Email { get; set; } // Hứng từ web cho có tụ, nhưng ko lưu DB
        public string Content { get; set; }
        public int Rating { get; set; }
    }

    // MODEL: Cấu trúc y chang bảng [ProductReviews] trong SQL của ní
   
}