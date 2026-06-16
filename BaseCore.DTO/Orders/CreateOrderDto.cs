namespace BaseCore.DTO.Orders;

public class CreateOrderDto
{
    public List<OrderItemDto> Items { get; set; } = new();
    public string? ShippingAddress { get; set; }
}
