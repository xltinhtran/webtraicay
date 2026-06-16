using Microsoft.AspNetCore.Http;

namespace BaseCore.DTO.Reviews;

public class SubmitReviewDto
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public IFormFile? ImageFile { get; set; }
}
