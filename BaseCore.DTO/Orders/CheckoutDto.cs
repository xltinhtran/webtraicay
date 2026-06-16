namespace BaseCore.DTO.Orders;

public class CheckoutDto
{
    public string? UserId { get; set; }
    public string? ShippingAddress { get; set; }
    public string? Phone { get; set; }
    public string? OrderNotes { get; set; }
    public string? PaymentMethod { get; set; }
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? ReceiverName { get; set; }
    public List<CheckoutDetailDto> Details { get; set; } = new();
}
