using Microsoft.EntityFrameworkCore;
using BaseCore.Entities; // Để nhận diện class Category
using BaseCore.Repository; // QUAN TRỌNG: Để nhận diện BaseCoreDbContext

namespace BaseCore.Repository.EFCore
{
    public interface ICategoryRepositoryEF : IRepository<Category>
    {
        Task<Category?> GetByNameAsync(string name);
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
    }
}