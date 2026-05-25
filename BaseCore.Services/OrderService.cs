using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BaseCore.Repository;

namespace BaseCore.Services
{
    public class OrderService : IOrderService
    {
        private readonly BaseCoreDbContext _context;

        public OrderService(BaseCoreDbContext context)
        {
            _context = context;
        }

        public async Task<Order> CreateOrderAsync(Order order)
        {
            order.OrderDate = DateTime.Now;
            order.Status = "Pending";

            // SQL tự tăng ID nên không gán order.Id
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();

            return order;
        }

        // 🛠️ ĐỔI TỪ Guid SANG string Ở ĐÂY NÈ NÍ!
        public async Task<List<Order>> GetOrdersByUserIdAsync(string userId)
        {
            return await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .Where(o => o.UserId == userId) // Bây giờ string == string, hết báo lỗi!
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }
    }
}