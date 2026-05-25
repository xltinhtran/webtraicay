//cateCTL
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BaseCore.Entities;
using BaseCore.Repository.EFCore;
using Microsoft.EntityFrameworkCore;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryRepositoryEF _categoryRepository;
        private readonly BaseCoreDbContext _context;

        public CategoriesController(ICategoryRepositoryEF categoryRepository, BaseCoreDbContext context)
        {
            _categoryRepository = categoryRepository;
            _context = context;
        }

        // --- 1. LẤY DANH SÁCH (CÓ TÌM KIẾM THEO 3 TIÊU CHÍ VÀ ĐẾM SẢN PHẨM) ---
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? keyword)
        {
            try
            {
                var query = _context.Categories.AsNoTracking().AsQueryable();

                // 🌟 BỘ TÌM KIẾM 3 TIÊU CHÍ: ID, Tên, hoặc Mô tả
                if (!string.IsNullOrEmpty(keyword))
                {
                    query = query.Where(c =>
                        c.Id.ToString().Contains(keyword) ||
                        c.Name.Contains(keyword) ||
                        (c.Description ?? "").Contains(keyword)
                    );
                }

                // Thực thi câu query, lấy dữ liệu và đếm sản phẩm bên trong
                var categories = await query
                    .Select(c => new
                    {
                        id = c.Id,
                        name = c.Name,
                        description = c.Description,
                        count = _context.Products.Count(p => p.CategoryId == c.Id)
                    }).ToListAsync();

                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi server: {ex.Message}");
            }
        }

        // --- 2. LẤY CHI TIẾT THEO ID ---
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            return Ok(category);
        }

        // --- 3. TẠO MỚI ---
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CategoryDto dto)
        {
            var existing = await _categoryRepository.GetByNameAsync(dto.Name);
            if (existing != null)
                return BadRequest(new { message = "Category name already exists" });

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description ?? ""
            };

            await _categoryRepository.AddAsync(category);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        // --- 4. CẬP NHẬT ---
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            category.Name = dto.Name ?? category.Name;
            category.Description = dto.Description ?? category.Description;

            await _categoryRepository.UpdateAsync(category);
            return Ok(category);
        }

        // --- 5. XÓA ---
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            await _categoryRepository.DeleteAsync(category);
            return Ok(new { message = "Category deleted successfully" });
        }
    }

    public class CategoryDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
    }
}