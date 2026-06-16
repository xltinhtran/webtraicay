using System;
namespace BaseCore.Entities // Đổi lại thành namespace của ní nếu khác
{
    public class Coupon
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public int DiscountPercent { get; set; }
        public DateTime ExpiryDate { get; set; }
        public bool IsActive { get; set; }
        public string CouponType { get; set; } = "Public";
        public string? UserId { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
    }
}
