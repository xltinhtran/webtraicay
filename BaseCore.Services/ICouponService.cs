using BaseCore.Entities;

namespace BaseCore.Services
{
    public interface ICouponService
    {
        Task<(List<Coupon> Coupons, int TotalCount)> SearchAsync(
            string? keyword,
            string? status,
            string? couponType,
            string? userId,
            int? minDiscount,
            int? maxDiscount,
            DateTime? expiryFrom,
            DateTime? expiryTo,
            int page,
            int pageSize);
        Task<Coupon?> GetByIdAsync(int id);
        Task<Coupon?> GetByCodeAsync(string code);
        Task<List<Coupon>> GetAvailableAsync(string? userId, decimal subtotal);
        Task<CouponValidationResult> ValidateForCheckoutAsync(string code, string? userId, decimal subtotal);
        Task<Coupon> CreateAsync(Coupon coupon);
        Task UpdateAsync(Coupon coupon);
        Task DeleteAsync(Coupon coupon);
    }

    public class CouponValidationResult
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = "";
        public Coupon? Coupon { get; set; }
    }
}
