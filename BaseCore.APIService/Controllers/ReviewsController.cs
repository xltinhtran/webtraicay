using BaseCore.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using BaseCore.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly BaseCoreDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ReviewsController(BaseCoreDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env; // Khởi tạo biến môi trường để lấy đường dẫn lưu ảnh
        }

        // 1. API NHẬN DỮ LIỆU ĐÁNH GIÁ TỪ REACT (Hỗ trợ Up ảnh)
        [HttpPost("submit")]
        [AllowAnonymous] // Tạm thời mở cửa để test dễ dàng
        public async Task<IActionResult> SubmitReview([FromForm] SubmitReviewDto reviewDto)
        {
            if (reviewDto == null || !ModelState.IsValid)
            {
                return BadRequest("Dữ liệu bị lỗi rùi ní ơi!");
            }

            try
            {
                // A. KIỂM TRA CHỐNG SPAM: Xem đơn hàng này đã đánh giá món này chưa?
                var existingReview = await _context.ProductReviews
                    .FirstOrDefaultAsync(r => r.OrderId == reviewDto.OrderId && r.ProductId == reviewDto.ProductId);

                if (existingReview != null)
                {
                    return BadRequest("Ní đã đánh giá sản phẩm này trong đơn hàng này rồi nha!");
                }

                // B. XỬ LÝ LƯU HÌNH ẢNH (Nếu khách có up ảnh)
                string imagePath = null;
                if (reviewDto.ImageFile != null && reviewDto.ImageFile.Length > 0)
                {
                    // Lấy đường dẫn tới thư mục wwwroot/img/reviews
                    string uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "img", "reviews");

                    // Nếu chưa có thư mục thì tự động tạo
                    if (!Directory.Exists(uploadsFolder))
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }

                    // Đổi tên file ngẫu nhiên để không bị trùng (vd: abc123_hinh.jpg)
                    string uniqueFileName = Guid.NewGuid().ToString() + "_" + reviewDto.ImageFile.FileName;
                    string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    // Copy file ảnh vào thư mục
                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await reviewDto.ImageFile.CopyToAsync(fileStream);
                    }

                    // Lưu cái đường link dọn sẵn để nhét vào Database
                    imagePath = "/img/reviews/" + uniqueFileName;
                }

                // C. TẠO ĐỐI TƯỢNG REVIEW VÀ LƯU VÀO DATABASE
                var newReview = new ProductReview
                {
                    OrderId = reviewDto.OrderId,
                    ProductId = reviewDto.ProductId,
                    UserName = reviewDto.UserName ?? "Khách hàng",
                    UserImage = "/img/avatar.jpg", // Có thể lấy từ User sau này
                    Rating = reviewDto.Rating,
                    Comment = reviewDto.Comment,
                    ImageUrl = imagePath, // Link ảnh vừa lưu (nếu có)
                    ReviewDate = DateTime.Now
                };

                _context.ProductReviews.Add(newReview);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Lưu đánh giá thành công!", data = newReview });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi C#: " + ex.Message);
            }
        }

        [HttpGet("product/{productId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewsByProduct(int productId)
        {
            var reviews = await _context.ProductReviews
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.ReviewDate)
                .Select(r => new
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
                })
                .ToListAsync();

            return Ok(reviews);
        }
        // 3. API LẤY SAO TRUNG BÌNH CỦA TẤT CẢ SẢN PHẨM
        [HttpGet("summary")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReviewSummary()
        {
            var summary = await _context.ProductReviews
                .GroupBy(r => r.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    AverageRating = Math.Round(g.Average(r => r.Rating), 1),
                    ReviewCount = g.Count()
                })
                .ToListAsync();

            return Ok(summary);
        }
    }

    // --- CÁC CLASS HỖ TRỢ ---

    // DTO: Cái rổ hứng dữ liệu từ React gửi qua (Dùng FromForm để nhận được File)
    public class SubmitReviewDto
    {
        public int OrderId { get; set; }
        public int ProductId { get; set; }

        // NHỚ THÊM DẤU ? VÀO MẤY CHỖ NÀY NÈ NÍ:
        public string? UserId { get; set; }
        public string? UserName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public IFormFile? ImageFile { get; set; } // Khách không up ảnh cũng không sao
    }
}