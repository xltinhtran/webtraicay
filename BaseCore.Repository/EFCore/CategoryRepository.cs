using Microsoft.EntityFrameworkCore;
using BaseCore.Entities; // Để nhận diện class Category
using BaseCore.Repository; // QUAN TRỌNG: Để nhận diện BaseCoreDbContext

namespace BaseCore.Repository.EFCore
{
    public interface ICategoryRepositoryEF : IRepository<Category>
    {
        Task<Category?> GetByNameAsync(string name);
        Task<List<CategoryWithProductCount>> SearchWithProductCountAsync(string? keyword);
    }

    public class CategoryRepositoryEF : Repository<Category>, ICategoryRepositoryEF
    {
        // Bây giờ nó sẽ hiểu BaseCoreDbContext là gì nhờ dòng using ở trên
        public CategoryRepositoryEF(BaseCoreDbContext context) : base(context)
        {
        }

        public async Task<Category?> GetByNameAsync(string name)
        {
            // _dbSet phải được khai báo ở lớp Repository cha (Base Class)
            return await _dbSet.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        }

        public async Task<List<CategoryWithProductCount>> SearchWithProductCountAsync(string? keyword)
        {
            var query = _dbSet.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(keyword))
            {
                query = query.Where(c =>
                    c.Id.ToString().Contains(keyword) ||
                    c.Name.Contains(keyword) ||
                    (c.Description ?? "").Contains(keyword));
            }

            return await query
                .Select(c => new CategoryWithProductCount
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Count = c.Products.Count
                })
                .ToListAsync();
        }
    }

    public class CategoryWithProductCount
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int Count { get; set; }
    }
}
