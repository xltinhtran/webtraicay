namespace BaseCore.DTO.Orders;

public class UpdatePendingOrderDetailDto
{
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
