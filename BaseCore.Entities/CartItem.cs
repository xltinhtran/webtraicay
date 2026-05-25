namespace BaseCore.Entities
{
    public class CartItem
    {
        public int Id { get; set; }
        public int CartId { get; set; }
        public Cart Cart { get; set; }

        public int ProductId { get; set; }
        public Product Product { get; set; } // Móc nối qua bảng Products để lấy Tên, Giá, Ảnh

        public int Quantity { get; set; } // Số lượng kg
    }
}