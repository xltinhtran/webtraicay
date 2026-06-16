using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Repository
{
    // 1. Interface với tên Entity rõ ràng
    public interface IUserRepository
    {
        Task<BaseCore.Entities.User?> GetByUsernameAsync(string username);
        Task<BaseCore.Entities.User?> GetByIdAsync(string id);
        Task<List<BaseCore.Entities.User>> GetAllAsync();
        Task CreateAsync(BaseCore.Entities.User user);
        Task UpdateAsync(BaseCore.Entities.User user);
        Task DeleteAsync(string id);
        Task<(List<BaseCore.Entities.User> Users, int TotalCount)> SearchAsync(string keyword, string? role, string? status, int page, int pageSize);
    }

    // 2. Lớp triển khai thực tế cho SQL Server
    public class UserRepository : IUserRepository
    {
        private readonly BaseCoreDbContext _context;

        public UserRepository(BaseCoreDbContext context)
        {
            _context = context;
        }

        public async Task<BaseCore.Entities.User?> GetByUsernameAsync(string username)
        {
            if (_context.Users == null) return null;

            return await _context.Users
                .AsNoTracking()
                // Đã xóa điều kiện u.IsActive vì DB không có cột này
                .FirstOrDefaultAsync(u => u.UserName == username);
        }

        public async Task<BaseCore.Entities.User?> GetByIdAsync(string id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<List<BaseCore.Entities.User>> GetAllAsync()
        {
            return await _context.Users
                // Đã xóa .Where(u => u.IsActive)
                .ToListAsync();
        }

        public async Task CreateAsync(BaseCore.Entities.User user)
        {
            if (string.IsNullOrEmpty(user.Id))
                user.Id = Guid.NewGuid().ToString();

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(BaseCore.Entities.User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(List<BaseCore.Entities.User> Users, int TotalCount)> SearchAsync(string keyword, string? role, string? status, int page, int pageSize)
        {
            // Đã xóa điều kiện u.IsActive
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                var k = keyword.ToLower();
                query = query.Where(u =>
                    (u.UserName ?? "").ToLower().Contains(k) ||
                    (u.Name ?? "").ToLower().Contains(k) ||
                    (u.Email ?? "").ToLower().Contains(k) ||
                    (u.Phone ?? "").ToLower().Contains(k));
            }

            if (!string.IsNullOrWhiteSpace(role))
            {
                var normalizedRole = role.Trim().ToLower();

                if (normalizedRole == "admin")
                {
                    query = query.Where(u => u.UserType == 1 || (u.Position != null && u.Position.ToLower().Contains("admin")));
                }
                else if (normalizedRole == "customer")
                {
                    query = query.Where(u => u.UserType == 0 || (u.Position != null && u.Position.ToLower().Contains("customer")));
                }
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToLower();

                if (normalizedStatus == "active")
                {
                    query = query.Where(u => u.IsActive);
                }
                else if (normalizedStatus == "inactive")
                {
                    query = query.Where(u => !u.IsActive);
                }
            }

            var totalCount = await query.CountAsync();

            var users = await query
                .OrderByDescending(u => u.Created)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (users, totalCount);
        }
    }
}
