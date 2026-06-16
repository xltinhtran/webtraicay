namespace BaseCore.DTO.Orders;

public class CheckoutDetailDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
