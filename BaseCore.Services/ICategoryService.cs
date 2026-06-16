using BaseCore.Entities;

namespace BaseCore.Services
{
    public interface ICategoryService
    {
        Task<List<CategoryWithProductCountResult>> SearchWithProductCountAsync(string? keyword);
        Task<Category?> GetByIdAsync(int id);
        Task<Category?> GetByNameAsync(string name);
        Task<Category> CreateAsync(Category category);
        Task UpdateAsync(Category category);
        Task DeleteAsync(Category category);
    }

    public class CategoryWithProductCountResult
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public int Count { get; set; }
    }
}
