using BaseCore.Entities;
using Microsoft.EntityFrameworkCore;

namespace BaseCore.Repository.EFCore
{
    public interface ICouponRepositoryEF : IRepository<Coupon>
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
        Task<Coupon?> GetByCodeAsync(string code);
        Task<List<Coupon>> GetAvailableAsync(string? userId, decimal subtotal);
    }

    public class CouponRepositoryEF : Repository<Coupon>, ICouponRepositoryEF
    {
        public CouponRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        public async Task<(List<Coupon> Coupons, int TotalCount)> SearchAsync(
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
            page = page < 1 ? 1 : page;
            pageSize = pageSize < 1 ? 10 : pageSize;

            var query = _dbSet.AsNoTracking().AsQueryable();
            var today = DateTime.Now.Date;

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var normalizedCode = keyword.Trim().ToUpper();
                query = query.Where(c => c.Code.ToUpper().Contains(normalizedCode));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToLower();

                if (normalizedStatus == "active")
                {
                    query = query.Where(c => c.IsActive && c.ExpiryDate >= today);
                }
                else if (normalizedStatus == "inactive")
                {
                    query = query.Where(c => !c.IsActive);
                }
                else if (normalizedStatus == "expired")
                {
                    query = query.Where(c => c.ExpiryDate < today);
                }
            }

            if (!string.IsNullOrWhiteSpace(couponType))
            {
                var normalizedType = couponType.Trim().ToLower();
                query = query.Where(c => (c.CouponType ?? "Public").ToLower() == normalizedType);
            }

            if (!string.IsNullOrWhiteSpace(userId))
            {
                var normalizedUserId = userId.Trim();
                query = query.Where(c => c.UserId == normalizedUserId);
            }

            if (minDiscount.HasValue)
            {
                query = query.Where(c => c.DiscountPercent >= minDiscount.Value);
            }

            if (maxDiscount.HasValue)
            {
                query = query.Where(c => c.DiscountPercent <= maxDiscount.Value);
            }

            if (expiryFrom.HasValue)
            {
                query = query.Where(c => c.ExpiryDate >= expiryFrom.Value.Date);
            }

            if (expiryTo.HasValue)
            {
                var endDate = expiryTo.Value.Date.AddDays(1);
                query = query.Where(c => c.ExpiryDate < endDate);
            }

            var totalCount = await query.CountAsync();
            var coupons = await query
                .OrderByDescending(c => c.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (coupons, totalCount);
        }

        public async Task<Coupon?> GetByCodeAsync(string code)
        {
            var normalizedCode = code.Trim().ToUpper();
            return await _dbSet.FirstOrDefaultAsync(c => c.Code.ToUpper() == normalizedCode);
        }

        public async Task<List<Coupon>> GetAvailableAsync(string? userId, decimal subtotal)
        {
            var normalizedUserId = string.IsNullOrWhiteSpace(userId) ? null : userId.Trim();
            var now = DateTime.Now;

            return await _dbSet
                .AsNoTracking()
                .Where(c => c.IsActive)
                .Where(c => c.ExpiryDate >= now)
                .Where(c => !c.MinOrderAmount.HasValue || subtotal >= c.MinOrderAmount.Value)
                .Where(c => !c.UsageLimit.HasValue || c.UsedCount < c.UsageLimit.Value)
                .Where(c =>
                    (c.CouponType ?? "Public") == "Public" ||
                    (normalizedUserId != null && c.UserId == normalizedUserId))
                .OrderByDescending(c => c.DiscountPercent)
                .ThenBy(c => c.ExpiryDate)
                .ToListAsync();
        }
    }
}
