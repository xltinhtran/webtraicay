namespace BaseCore.DTO.Carts;

public class AddToCartRequest
{
    public string UserId { get; set; } = "";
    public int ProductId { get; set; }
    public int Quantity { get; set; }
}
