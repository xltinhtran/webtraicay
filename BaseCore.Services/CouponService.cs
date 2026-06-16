using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Services
{
    public class CouponService : ICouponService
    {
        private readonly ICouponRepositoryEF _couponRepository;

        public CouponService(ICouponRepositoryEF couponRepository)
        {
            _couponRepository = couponRepository;
        }

        public Task<(List<Coupon> Coupons, int TotalCount)> SearchAsync(
            string? keyword,
            string? status,
            string? couponType,
            string? userId,
            int? minDiscount,
            int? maxDiscount,
            DateTime? expiryFrom,
            DateTime? expiryTo,
            int page,
            int pageSize)
        {
            return _couponRepository.SearchAsync(keyword, status, couponType, userId, minDiscount, maxDiscount, expiryFrom, expiryTo, page, pageSize);
        }

        public Task<Coupon?> GetByIdAsync(int id)
        {
            return _couponRepository.GetByIdAsync(id);
        }

        public Task<Coupon?> GetByCodeAsync(string code)
        {
            return _couponRepository.GetByCodeAsync(code);
        }

        public Task<List<Coupon>> GetAvailableAsync(string? userId, decimal subtotal)
        {
            return _couponRepository.GetAvailableAsync(userId, subtotal);
        }

        public async Task<CouponValidationResult> ValidateForCheckoutAsync(string code, string? userId, decimal subtotal)
        {
            if (string.IsNullOrWhiteSpace(code))
                return Invalid("Vui long nhap ma giam gia!");

            var coupon = await _couponRepository.GetByCodeAsync(code.Trim().ToUpper());
            if (coupon == null)
                return Invalid("Ma giam gia khong ton tai!");

            if (!coupon.IsActive)
                return Invalid("Ma giam gia nay da bi khoa!");

            if (coupon.ExpiryDate < DateTime.Now)
                return Invalid("Ma giam gia nay da het han!");

            var couponType = string.IsNullOrWhiteSpace(coupon.CouponType)
                ? "Public"
                : coupon.CouponType.Trim();

            if (couponType != "Public")
            {
                if (string.IsNullOrWhiteSpace(userId))
                    return Invalid("Vui long dang nhap de dung voucher rieng!");

                if (string.IsNullOrWhiteSpace(coupon.UserId) || coupon.UserId != userId.Trim())
                    return Invalid("Voucher nay chi ap dung cho tai khoan duoc tang!");
            }

            if (coupon.MinOrderAmount.HasValue && subtotal < coupon.MinOrderAmount.Value)
                return Invalid($"Don hang phai tu {coupon.MinOrderAmount.Value:N0} d moi dung duoc voucher nay!");

            if (coupon.UsageLimit.HasValue && coupon.UsedCount >= coupon.UsageLimit.Value)
                return Invalid("Voucher nay da het luot su dung!");

            return new CouponValidationResult
            {
                IsValid = true,
                Message = "Voucher hop le",
                Coupon = coupon
            };
        }

        public Task<Coupon> CreateAsync(Coupon coupon)
        {
            return _couponRepository.AddAsync(coupon);
        }

        public Task UpdateAsync(Coupon coupon)
        {
            return _couponRepository.UpdateAsync(coupon);
        }

        public Task DeleteAsync(Coupon coupon)
        {
            return _couponRepository.DeleteAsync(coupon);
        }

        private static CouponValidationResult Invalid(string message)
        {
            return new CouponValidationResult
            {
                IsValid = false,
                Message = message
            };
        }
    }
}
