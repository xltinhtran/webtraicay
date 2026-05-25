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
    }
}