using BaseCore.Entities;
using BaseCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;

        public CategoriesController(ICategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? keyword)
        {
            try
            {
                var categories = await _categoryService.SearchWithProductCountAsync(keyword);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Loi server: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _categoryService.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            return Ok(category);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CategoryDto dto)
        {
            var existing = await _categoryService.GetByNameAsync(dto.Name);
            if (existing != null)
                return BadRequest(new { message = "Category name already exists" });

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description ?? ""
            };

            await _categoryService.CreateAsync(category);
            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] CategoryDto dto)
        {
            var category = await _categoryService.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            category.Name = dto.Name ?? category.Name;
            category.Description = dto.Description ?? category.Description;

            await _categoryService.UpdateAsync(category);
            return Ok(category);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var category = await _categoryService.GetByIdAsync(id);
            if (category == null)
                return NotFound(new { message = "Category not found" });

            await _categoryService.DeleteAsync(category);
            return Ok(new { message = "Category deleted successfully" });
        }
    }

    public class CategoryDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
    }
}
