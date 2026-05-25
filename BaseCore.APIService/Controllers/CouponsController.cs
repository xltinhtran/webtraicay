//CouponsCTL
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using BaseCore.Entities;
using BaseCore.Repository;

namespace BaseCore.APIService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponsController : ControllerBase
    {
        private readonly BaseCoreDbContext _context;
        public CouponsController(BaseCoreDbContext context) { _context = context; }

        [HttpGet("check")]
        public async Task<IActionResult> CheckCoupon([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code)) return BadRequest("Vui lòng nhập mã!");

            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code.ToUpper());

            if (coupon == null) return NotFound("Mã không tồn tại rùi ní ơi!");
            if (!coupon.IsActive) return BadRequest("Mã này đã bị khóa!");
            if (coupon.ExpiryDate < DateTime.Now) return BadRequest("Mã này hết hạn rồi!");

            return Ok(new { isValid = true, discountPercent = coupon.DiscountPercent });
        }
    }
}