//ProductCTL
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    /// <summary>
    /// Product API Controller
    /// Teaching: RESTful API, CRUD Operations, EF Core (Bài 10, 11)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepositoryEF _productRepository;
        private readonly ICategoryRepositoryEF _categoryRepository;
        private readonly BaseCoreDbContext _context;

        public ProductsController(IProductRepositoryEF productRepository, ICategoryRepositoryEF categoryRepository, BaseCoreDbContext context)
        {
            _productRepository = productRepository;
            _categoryRepository = categoryRepository;
            _context = context;
        }

        /// <summary>
        /// Get all products with pagination and search
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                // Khởi tạo query móc thẳng vào DB
                var query = _context.Products.AsNoTracking().AsQueryable();

                // 🌟 BỘ TÌM KIẾM 3 TIÊU CHÍ (TÊN SP, TÊN DANH MỤC, CHẤT LƯỢNG) 🌟
                if (!string.IsNullOrEmpty(keyword))
                {
                    query = query.Where(p =>
                        p.Name.Contains(keyword) ||
                        p.Category.Name.Contains(keyword) || // Móc sang bảng Category lấy Tên ra tìm
                        (p.Quality ?? "").Contains(keyword)
                    );
                }

                // Giữ lại logic lọc theo Category cũ của ní lỡ sau này xài
                if (categoryId.HasValue && categoryId > 0)
                {
                    query = query.Where(p => p.CategoryId == categoryId);
                }

                // Đếm tổng số lượng để chia trang
                var totalCount = await query.CountAsync();

                // Cắt lấy đúng số dòng của trang đó
                var products = await query
                    .OrderByDescending(p => p.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Trả về cho React
                return Ok(new
                {
                    items = products,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        /// <summary>
        /// Get product by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }

        /// <summary>
        /// Create new product (requires authentication)
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            // Validate category exists
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Category not found" });

            var product = new Product
            {
                Name = dto.Name,
                Price = dto.Price,
                Stock = dto.Stock,
                CategoryId = dto.CategoryId,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl ?? "",
                Quality = dto.Quality,

                // ---> NHẬN CÔNG TẮC VÀ TÍNH GIÁ GIẢM 30% TỰ ĐỘNG
                IsFeatured = dto.IsFeatured,
                DiscountPrice = dto.IsFeatured ? dto.Price * 0.7m : 0
            };

            await _productRepository.AddAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        /// <summary>
        /// Update product (requires authentication)
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.Name = dto.Name ?? product.Name;
            product.Price = dto.Price ?? product.Price;
            product.Stock = dto.Stock ?? product.Stock;
            product.CategoryId = dto.CategoryId ?? product.CategoryId;
            product.Description = dto.Description ?? product.Description;
            product.ImageUrl = dto.ImageUrl ?? product.ImageUrl;
            product.Quality = dto.Quality ?? product.Quality;

            // ---> CẬP NHẬT CÔNG TẮC NẾU CÓ GỬI LÊN
            if (dto.IsFeatured.HasValue)
            {
                product.IsFeatured = dto.IsFeatured.Value;
            }

            // ---> TÍNH LẠI GIÁ (Lỡ Admin có đổi Giá gốc thì Giá giảm cũng phải nhảy theo)
            if (product.IsFeatured)
            {
                product.DiscountPrice = product.Price * 0.7m; // Giảm 30%
            }
            else
            {
                product.DiscountPrice = 0; // Tắt nổi bật thì chém luôn giá giảm
            }

            await _productRepository.UpdateAsync(product);
            return Ok(product);
        }

        /// <summary>
        /// Delete product (requires authentication)
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productRepository.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            await _productRepository.DeleteAsync(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        /// <summary>
        /// Get products by category
        /// </summary>
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return Ok(products);
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            var featured = await _context.Products
                                 .Where(p => p.IsFeatured)
                                 //.Take(3)
                                 .ToListAsync();

            return Ok(featured);
        }
    }

    // DTOs
    public class ProductCreateDto
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Quality { get; set; }

        // ---> MỞ ĐƯỜNG CHO CÔNG TẮC TỪ REACT BAY VÀO
        public bool IsFeatured { get; set; }
    }

    public class ProductUpdateDto
    {
        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public int? Stock { get; set; }
        public int? CategoryId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Quality { get; set; }

        // ---> MỞ ĐƯỜNG CHO CÔNG TẮC TỪ REACT BAY VÀO (Cho phép null)
        public bool? IsFeatured { get; set; }
    }
}