using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository; // <--- Đã sửa thành chuẩn, xóa chữ .Authen
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Repository.EFCore
{
    public class UserRepositoryEF : Repository<User>, IUserRepository
    {
        public UserRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        // Fix lỗi CS0738: Cài đặt cụ thể cho IUserRepository để trả về List<User>
        public new async Task<List<User>> GetAllAsync()
        {
            // Đã xóa u.IsActive để không bị lỗi CS1061
            return await _dbSet.ToListAsync();
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            // Đã xóa u.IsActive
            return await _dbSet.FirstOrDefaultAsync(u => u.UserName == username);
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Id == id);
        }

        // Dùng từ khóa 'new' để báo cho C# biết bạn chủ động thay thế hàm của lớp Base
        public new async Task CreateAsync(User user)
        {
            await _dbSet.AddAsync(user);
            await _context.SaveChangesAsync();
        }

        public new async Task UpdateAsync(User user)
        {
            _dbSet.Update(user);
            await _context.SaveChangesAsync();
        }

        public new async Task DeleteAsync(string id)
        {
            var user = await GetByIdAsync(id);
            if (user != null)
            {
                _dbSet.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<(List<User> Users, int TotalCount)> SearchAsync(string? keyword, string? role, string? status, int page, int pageSize)
        {
            var query = _dbSet.AsQueryable();

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
