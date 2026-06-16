namespace BaseCore.DTO.Orders;

public class UpdatePendingOrderDto
{
    public string? ReceiverName { get; set; }
    public string? Phone { get; set; }
    public string? ShippingAddress { get; set; }
    public string? OrderNotes { get; set; }
    public List<UpdatePendingOrderDetailDto> Details { get; set; } = new();
}
