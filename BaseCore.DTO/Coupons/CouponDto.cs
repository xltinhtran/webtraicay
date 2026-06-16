namespace BaseCore.DTO.Coupons;

public class CouponDto
{
    public string Code { get; set; } = "";
    public int DiscountPercent { get; set; }
    public DateTime ExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public string? CouponType { get; set; }
    public string? UserId { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
}
