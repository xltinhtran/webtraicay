namespace BaseCore.Entities;

public partial class Order
{
    public int Id { get; set; }
    public string UserId { get; set; } = null!;
    public DateTime OrderDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = null!;
    public string ShippingAddress { get; set; } = null!;
    public string PaymentMethod { get; set; } = null!;
    public string? OrderNotes { get; set; }

    // SỬA DÒNG NÀY NÈ NÍ: Thêm dấu ? vào đây
    public string? CouponCode { get; set; }

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
    public virtual User User { get; set; } = null!;
}