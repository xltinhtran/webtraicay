namespace BaseCore.DTO.Products;

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
