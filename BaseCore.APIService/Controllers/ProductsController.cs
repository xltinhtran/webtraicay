using BaseCore.Entities;
using BaseCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly ICategoryService _categoryService;
        private readonly IWebHostEnvironment _env;

        public ProductsController(IProductService productService, ICategoryService categoryService, IWebHostEnvironment env)
        {
            _productService = productService;
            _categoryService = categoryService;
            _env = env;
        }

        [HttpPost("upload-image")]
        [Authorize]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile imageFile)
        {
            if (imageFile == null || imageFile.Length == 0)
                return BadRequest(new { message = "Image file is required" });

            if (!IsAllowedImage(imageFile.FileName))
                return BadRequest(new { message = "Only JPG, PNG, GIF, and WEBP images are allowed" });

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "img", "products");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = BuildUniqueImageFileName(imageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            return Ok(new { imageUrl = $"/img/products/{uniqueFileName}" });
        }

        [HttpGet("{id}/images")]
        public async Task<IActionResult> GetImages(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            var galleryFolder = GetProductGalleryFolder(id);
            if (!Directory.Exists(galleryFolder))
                return Ok(Array.Empty<object>());

            var files = Directory.GetFiles(galleryFolder)
                .Where(file => IsAllowedImage(file))
                .OrderBy(file => System.IO.File.GetCreationTimeUtc(file))
                .Select(file => new
                {
                    imageUrl = $"/img/products/{id}/gallery/{Path.GetFileName(file)}"
                })
                .ToList();

            return Ok(files);
        }

        [HttpPost("{id}/images")]
        [Authorize]
        public async Task<IActionResult> UploadImages(int id, [FromForm] List<IFormFile> imageFiles)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            if (imageFiles == null || imageFiles.Count == 0)
                return BadRequest(new { message = "At least one image file is required" });

            var galleryFolder = GetProductGalleryFolder(id);
            if (!Directory.Exists(galleryFolder))
                Directory.CreateDirectory(galleryFolder);

            var uploadedImages = new List<object>();

            foreach (var imageFile in imageFiles)
            {
                if (imageFile == null || imageFile.Length == 0)
                    continue;

                if (!IsAllowedImage(imageFile.FileName))
                    return BadRequest(new { message = "Only JPG, PNG, GIF, and WEBP images are allowed" });

                var uniqueFileName = BuildUniqueImageFileName(imageFile.FileName);
                var filePath = Path.Combine(galleryFolder, uniqueFileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await imageFile.CopyToAsync(fileStream);
                }

                uploadedImages.Add(new
                {
                    imageUrl = $"/img/products/{id}/gallery/{uniqueFileName}"
                });
            }

            return Ok(uploadedImages);
        }

        [HttpDelete("{id}/images")]
        [Authorize]
        public async Task<IActionResult> DeleteImage(int id, [FromQuery] string imageUrl)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            if (string.IsNullOrWhiteSpace(imageUrl))
                return BadRequest(new { message = "Image URL is required" });

            var galleryFolder = GetProductGalleryFolder(id);
            var fileName = Path.GetFileName(imageUrl);
            var filePath = Path.GetFullPath(Path.Combine(galleryFolder, fileName));
            var safeGalleryFolder = Path.GetFullPath(galleryFolder);

            if (!filePath.StartsWith(safeGalleryFolder, StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Invalid image path" });

            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            return Ok(new { message = "Image deleted successfully" });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] int? categoryId,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? quality,
            [FromQuery] string? stockStatus,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var (products, totalCount) = await _productService.SearchAsync(keyword, categoryId, minPrice, maxPrice, quality, stockStatus, page, pageSize);

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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            return Ok(product);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] ProductCreateDto dto)
        {
            var category = await _categoryService.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Category not found" });

            var product = new Product
            {
                Name = dto.Name,
                Price = dto.Price,
                Stock = dto.Stock,
                Unit = string.IsNullOrWhiteSpace(dto.Unit) ? "sản phẩm" : dto.Unit.Trim(),
                LowStockThreshold = dto.LowStockThreshold <= 0 ? 10 : dto.LowStockThreshold,
                CategoryId = dto.CategoryId,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl ?? "",
                Quality = dto.Quality,
                IsFeatured = dto.IsFeatured,
                DiscountPrice = dto.IsFeatured ? dto.Price * 0.7m : 0
            };

            await _productService.CreateAsync(product);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateDto dto)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            product.Name = dto.Name ?? product.Name;
            product.Price = dto.Price ?? product.Price;
            product.Stock = dto.Stock ?? product.Stock;
            product.Unit = string.IsNullOrWhiteSpace(dto.Unit) ? product.Unit : dto.Unit.Trim();
            product.LowStockThreshold = dto.LowStockThreshold ?? product.LowStockThreshold;
            product.CategoryId = dto.CategoryId ?? product.CategoryId;
            product.Description = dto.Description ?? product.Description;
            product.ImageUrl = dto.ImageUrl ?? product.ImageUrl;
            product.Quality = dto.Quality ?? product.Quality;

            if (dto.IsFeatured.HasValue)
                product.IsFeatured = dto.IsFeatured.Value;

            product.DiscountPrice = product.IsFeatured ? product.Price * 0.7m : 0;

            await _productService.UpdateAsync(product);
            return Ok(product);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _productService.GetByIdAsync(id);
            if (product == null)
                return NotFound(new { message = "Product not found" });

            await _productService.DeleteAsync(product);
            return Ok(new { message = "Product deleted successfully" });
        }

        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productService.GetByCategoryAsync(categoryId);
            return Ok(products);
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            var featured = await _productService.GetFeaturedAsync();
            return Ok(featured);
        }

        private string GetProductGalleryFolder(int productId)
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            return Path.Combine(webRoot, "img", "products", productId.ToString(), "gallery");
        }

        private static bool IsAllowedImage(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            return allowedExtensions.Contains(extension);
        }

        private static string BuildUniqueImageFileName(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var safeFileName = Path.GetFileNameWithoutExtension(fileName);

            foreach (var invalidChar in Path.GetInvalidFileNameChars())
            {
                safeFileName = safeFileName.Replace(invalidChar, '-');
            }

            return $"{Guid.NewGuid()}_{safeFileName}{extension}";
        }
    }

    public class ProductCreateDto
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public decimal Stock { get; set; }
        public string? Unit { get; set; }
        public decimal LowStockThreshold { get; set; } = 10;
        public int CategoryId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Quality { get; set; }
        public bool IsFeatured { get; set; }
    }

    public class ProductUpdateDto
    {
        public string? Name { get; set; }
        public decimal? Price { get; set; }
        public decimal? Stock { get; set; }
        public string? Unit { get; set; }
        public decimal? LowStockThreshold { get; set; }
        public int? CategoryId { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Quality { get; set; }
        public bool? IsFeatured { get; set; }
    }

}
