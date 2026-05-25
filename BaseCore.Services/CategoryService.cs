using Microsoft.EntityFrameworkCore;
using BaseCore.Entities;
using BaseCore.Repository;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly BaseCoreDbContext _context;

        public CategoryService(BaseCoreDbContext context)
        {
            _context = context;
        }

        public async Task<List<Category>> GetAllAsync()
        {
            // Lấy toàn bộ danh sách Category từ SQL Server
            return await _context.Categories.ToListAsync();
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            // Tìm theo khóa chính nhanh nhất bằng FindAsync
            return await _context.Categories.FindAsync(id);
        }

        public async Task<Category> CreateAsync(Category category)
        {
            // BỎ qua bước lấy MaxId + 1 vì SQL Server đã có IDENTITY(1,1) tự tăng rồi
            await _context.Categories.AddAsync(category);
            await _context.SaveChangesAsync(); // Lưu thay đổi xuống SQL

            return category;
        }

        public async Task UpdateAsync(Category category)
        {
            // Cập nhật bản ghi
            _context.Categories.Update(category);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category != null)
            {
                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();
            }
        }
    }
}