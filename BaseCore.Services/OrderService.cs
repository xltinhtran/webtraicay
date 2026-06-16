using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepositoryEF _orderRepository;
        private readonly IOrderDetailRepositoryEF _orderDetailRepository;

        public OrderService(IOrderRepositoryEF orderRepository, IOrderDetailRepositoryEF orderDetailRepository)
        {
            _orderRepository = orderRepository;
            _orderDetailRepository = orderDetailRepository;
        }

        public async Task<List<OrderHistoryResult>> GetOrderHistoryByUserAsync(string userId)
        {
            var orders = await _orderRepository.GetOrderHistoryByUserAsync(userId);

            return orders.Select(o => new OrderHistoryResult
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                PaymentMethod = o.PaymentMethod,
                ReceiverName = o.ReceiverName,
                ShippingAddress = o.ShippingAddress,
                Phone = o.Phone,
                OrderNotes = o.OrderNotes,
                CancelReason = o.CancelReason,
                CancelledAt = o.CancelledAt,
                Details = o.Details.Select(d => new OrderDetailHistoryResult
                {
                    ProductId = d.ProductId,
                    ProductName = d.ProductName,
                    ProductImageUrl = d.ProductImageUrl,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    IsReviewed = d.IsReviewed
                }).ToList()
            }).ToList();
        }

        public async Task<List<OrderAdminSearchResult>> SearchAdminOrdersAsync(string? keyword)
        {
            var orders = await _orderRepository.SearchAdminOrdersAsync(keyword);

            return orders.Select(o => new OrderAdminSearchResult
            {
                Id = o.Id,
                UserId = o.UserId,
                CustomerName = o.CustomerName,
                TotalAmount = o.TotalAmount,
                Status = o.Status,
                OrderDate = o.OrderDate
            }).ToList();
        }

        public Task<Order?> GetByIdAsync(int id)
        {
            return _orderRepository.GetByIdAsync(id);
        }

        public Task<List<OrderDetail>> GetDetailsByOrderAsync(int orderId)
        {
            return _orderDetailRepository.GetByOrderAsync(orderId);
        }

        public Task<int> CheckoutAsync(string userId, Order order, List<OrderDetail> details, string? couponCode)
        {
            return _orderRepository.CheckoutAsync(userId, order, details, couponCode);
        }

        public Task<Order> CreateAsync(Order order)
        {
            return _orderRepository.AddAsync(order);
        }

        public Task<OrderDetail> CreateDetailAsync(OrderDetail detail)
        {
            return _orderDetailRepository.AddAsync(detail);
        }

        public Task UpdateStatusAsync(int id, string status)
        {
            return _orderRepository.UpdateStatusAsync(id, status);
        }

        public Task<Order> CancelOrderAsync(int id, string reason)
        {
            return _orderRepository.CancelOrderAsync(id, reason);
        }

        public Task DeleteWithDetailsAsync(int id)
        {
            return _orderRepository.DeleteWithDetailsAsync(id);
        }

        public Task<Order> UpdatePendingOrderAsync(int id, OrderPendingUpdateData data)
        {
            var repositoryData = new PendingOrderUpdateData
            {
                ReceiverName = data.ReceiverName,
                Phone = data.Phone,
                ShippingAddress = data.ShippingAddress,
                OrderNotes = data.OrderNotes,
                Details = data.Details.Select(item => new PendingOrderUpdateDetailData
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                }).ToList()
            };

            return _orderRepository.UpdatePendingOrderAsync(id, repositoryData);
        }
    }
}
