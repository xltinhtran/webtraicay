using BaseCore.Entities;
using BaseCore.Repository.EFCore;

namespace BaseCore.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepositoryEF _categoryRepository;

        public CategoryService(ICategoryRepositoryEF categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<List<CategoryWithProductCountResult>> SearchWithProductCountAsync(string? keyword)
        {
            var categories = await _categoryRepository.SearchWithProductCountAsync(keyword);

            return categories.Select(c => new CategoryWithProductCountResult
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Count = c.Count
            }).ToList();
        }

        public Task<Category?> GetByIdAsync(int id)
        {
            return _categoryRepository.GetByIdAsync(id);
        }

        public Task<Category?> GetByNameAsync(string name)
        {
            return _categoryRepository.GetByNameAsync(name);
        }

        public Task<Category> CreateAsync(Category category)
        {
            return _categoryRepository.AddAsync(category);
        }

        public Task UpdateAsync(Category category)
        {
            return _categoryRepository.UpdateAsync(category);
        }

        public Task DeleteAsync(Category category)
        {
            return _categoryRepository.DeleteAsync(category);
        }
    }
}
