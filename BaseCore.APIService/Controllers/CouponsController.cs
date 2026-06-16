using BaseCore.DTO.Coupons;
using BaseCore.Entities;
using BaseCore.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponsController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponsController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? keyword,
            [FromQuery] string? status,
            [FromQuery] string? couponType,
            [FromQuery] string? userId,
            [FromQuery] int? minDiscount,
            [FromQuery] int? maxDiscount,
            [FromQuery] DateTime? expiryFrom,
            [FromQuery] DateTime? expiryTo,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var (coupons, totalCount) = await _couponService.SearchAsync(
                keyword,
                status,
                couponType,
                userId,
                minDiscount,
                maxDiscount,
                expiryFrom,
                expiryTo,
                page,
                pageSize);

            return Ok(new
            {
                items = coupons,
                totalCount,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("available")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAvailable([FromQuery] string? userId, [FromQuery] decimal subtotal = 0)
        {
            var coupons = await _couponService.GetAvailableAsync(userId, subtotal);
            return Ok(coupons);
        }

        [HttpGet("{id:int}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var coupon = await _couponService.GetByIdAsync(id);
            if (coupon == null)
                return NotFound(new { message = "Coupon not found" });

            return Ok(coupon);
        }

        [HttpGet("check")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckCoupon(
            [FromQuery] string code,
            [FromQuery] string? userId,
            [FromQuery] decimal subtotal = 0)
        {
            if (string.IsNullOrEmpty(code))
                return BadRequest("Vui long nhap ma!");

            var result = await _couponService.ValidateForCheckoutAsync(code, userId, subtotal);
            if (!result.IsValid || result.Coupon == null)
                return BadRequest(result.Message);

            return Ok(new
            {
                isValid = true,
                discountPercent = result.Coupon.DiscountPercent,
                couponType = result.Coupon.CouponType,
                minOrderAmount = result.Coupon.MinOrderAmount
            });
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CouponDto dto)
        {
            var validationError = ValidateCoupon(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var normalizedCode = dto.Code.Trim().ToUpper();
            var existing = await _couponService.GetByCodeAsync(normalizedCode);
            if (existing != null)
                return BadRequest(new { message = "Coupon code already exists" });

            var coupon = new Coupon
            {
                Code = normalizedCode,
                DiscountPercent = dto.DiscountPercent,
                ExpiryDate = dto.ExpiryDate,
                IsActive = dto.IsActive,
                CouponType = NormalizeCouponType(dto.CouponType),
                UserId = string.IsNullOrWhiteSpace(dto.UserId) ? null : dto.UserId.Trim(),
                MinOrderAmount = dto.MinOrderAmount,
                UsageLimit = dto.UsageLimit,
                UsedCount = Math.Max(0, dto.UsedCount)
            };

            await _couponService.CreateAsync(coupon);
            return CreatedAtAction(nameof(GetById), new { id = coupon.Id }, coupon);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] CouponDto dto)
        {
            var validationError = ValidateCoupon(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var coupon = await _couponService.GetByIdAsync(id);
            if (coupon == null)
                return NotFound(new { message = "Coupon not found" });

            var normalizedCode = dto.Code.Trim().ToUpper();
            var existing = await _couponService.GetByCodeAsync(normalizedCode);
            if (existing != null && existing.Id != id)
                return BadRequest(new { message = "Coupon code already exists" });

            coupon.Code = normalizedCode;
            coupon.DiscountPercent = dto.DiscountPercent;
            coupon.ExpiryDate = dto.ExpiryDate;
            coupon.IsActive = dto.IsActive;
            coupon.CouponType = NormalizeCouponType(dto.CouponType);
            coupon.UserId = string.IsNullOrWhiteSpace(dto.UserId) ? null : dto.UserId.Trim();
            coupon.MinOrderAmount = dto.MinOrderAmount;
            coupon.UsageLimit = dto.UsageLimit;
            coupon.UsedCount = Math.Max(0, dto.UsedCount);

            await _couponService.UpdateAsync(coupon);
            return Ok(coupon);
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var coupon = await _couponService.GetByIdAsync(id);
            if (coupon == null)
                return NotFound(new { message = "Coupon not found" });

            await _couponService.DeleteAsync(coupon);
            return Ok(new { message = "Coupon deleted successfully" });
        }

        private static string? ValidateCoupon(CouponDto dto)
        {
            if (dto == null)
                return "Invalid coupon data";

            if (string.IsNullOrWhiteSpace(dto.Code))
                return "Coupon code is required";

            if (dto.DiscountPercent < 1 || dto.DiscountPercent > 100)
                return "Discount percent must be from 1 to 100";

            var couponType = NormalizeCouponType(dto.CouponType);
            if ((couponType == "Personal" || couponType == "Loyalty") && string.IsNullOrWhiteSpace(dto.UserId))
                return "Voucher rieng phai chon khach hang";

            if (dto.MinOrderAmount.HasValue && dto.MinOrderAmount.Value < 0)
                return "Gia tri don toi thieu khong hop le";

            if (dto.UsageLimit.HasValue && dto.UsageLimit.Value < 1)
                return "Gioi han luot dung phai lon hon 0";

            if (dto.UsedCount < 0)
                return "So luot da dung khong hop le";

            return null;
        }

        private static string NormalizeCouponType(string? couponType)
        {
            var normalized = string.IsNullOrWhiteSpace(couponType) ? "Public" : couponType.Trim();
            return normalized.ToLower() switch
            {
                "personal" => "Personal",
                "loyalty" => "Loyalty",
                _ => "Public"
            };
        }
    }
}
