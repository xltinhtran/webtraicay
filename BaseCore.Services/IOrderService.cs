using BaseCore.Entities;

namespace BaseCore.Services
{
    public interface IOrderService
    {
        Task<List<OrderHistoryResult>> GetOrderHistoryByUserAsync(string userId);
        Task<List<OrderAdminSearchResult>> SearchAdminOrdersAsync(string? keyword);
        Task<Order?> GetByIdAsync(int id);
        Task<List<OrderDetail>> GetDetailsByOrderAsync(int orderId);
        Task<int> CheckoutAsync(string userId, Order order, List<OrderDetail> details, string? couponCode);
        Task<Order> CreateAsync(Order order);
        Task<OrderDetail> CreateDetailAsync(OrderDetail detail);
        Task UpdateStatusAsync(int id, string status);
        Task<Order> CancelOrderAsync(int id, string reason);
        Task DeleteWithDetailsAsync(int id);
        Task<Order> UpdatePendingOrderAsync(int id, OrderPendingUpdateData data);
    }

    public class OrderPendingUpdateData
    {
        public string ReceiverName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string ShippingAddress { get; set; } = "";
        public string? OrderNotes { get; set; }
        public List<OrderPendingUpdateDetailData> Details { get; set; } = new();
    }

    public class OrderPendingUpdateDetailData
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class OrderHistoryResult
    {
        public int Id { get; set; }
        public DateTime? OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public string? PaymentMethod { get; set; }
        public string? ReceiverName { get; set; }
        public string? ShippingAddress { get; set; }
        public string? Phone { get; set; }
        public string? OrderNotes { get; set; }
        public string? CancelReason { get; set; }
        public DateTime? CancelledAt { get; set; }
        public List<OrderDetailHistoryResult> Details { get; set; } = new();
    }

    public class OrderDetailHistoryResult
    {
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public bool IsReviewed { get; set; }
    }

    public class OrderAdminSearchResult
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public string CustomerName { get; set; } = "";
        public decimal TotalAmount { get; set; }
        public string? Status { get; set; }
        public DateTime? OrderDate { get; set; }
    }
}
