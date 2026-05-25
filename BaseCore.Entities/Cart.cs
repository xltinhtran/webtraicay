using System.Collections.Generic;

namespace BaseCore.Entities
{
    public class Cart
    {
        public int Id { get; set; }
        public string UserId { get; set; } // Mã khách hàng (VD: CUST-001)
        public ICollection<CartItem> CartItems { get; set; }
    }
}