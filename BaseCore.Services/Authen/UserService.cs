using BaseCore.Common;
using BaseCore.Entities;
using BaseCore.Repository;
using BaseCore.Repository.EFCore; // <--- Sửa .Authen thành .EFCore (nơi chứa IUserRepository hiện tại)
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BaseCore.Services.Authen
{
    // --- 1. INTERFACE ---
    public interface IUserService
    {
        Task<User?> Authenticate(string username, string password);
        Task<List<User>> GetAll();
        Task<User?> GetById(string id);
        Task<User> Create(User user, string password);
        Task Update(User user, string password = null);
        Task Delete(string id);
        Task<(List<User> Users, int TotalCount)> Search(string keyword, string? role, string? status, int page, int pageSize);
    }

    // --- 2. LỚP TRIỂN KHAI LOGIC ---
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public UserService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<User?> Authenticate(string username, string password)
        {
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
                return null;

            var user = await _userRepository.GetByUsernameAsync(username);

            // Đã bỏ user.IsActive vì SQL Server không có cột này
            if (user == null)
                return null;

            // Vì DB SQL không có cột Salt, tạm thời dùng so sánh trực tiếp. 
            // (Sau này ní rảnh có thể dùng thư viện BCrypt để mã hóa password mà không cần cột Salt)
            bool isValidPassword = (user.Password == password);

            if (!isValidPassword) return null;

            return user;
        }

        public async Task<List<User>> GetAll()
        {
            var users = await _userRepository.GetAllAsync();
            return users.ToList();
        }

        public async Task<User?> GetById(string id)
        {
            return await _userRepository.GetByIdAsync(id);
        }

        public async Task<User> Create(User user, string password)
        {
            // Bỏ logic Salt, lưu thẳng password vào (sau này cấu hình BCrypt mã hóa sau)
            user.Password = password;

            if (string.IsNullOrEmpty(user.Id))
                user.Id = Guid.NewGuid().ToString();

            user.Created = DateTime.Now;
            // Đã bỏ user.IsActive = true;

            await _userRepository.CreateAsync(user);
            return user;
        }

        public async Task Update(User user, string password = null)
        {
            if (!string.IsNullOrEmpty(password))
            {
                // Bỏ logic Salt
                user.Password = password;
            }
            await _userRepository.UpdateAsync(user);
        }

        public async Task Delete(string id)
        {
            await _userRepository.DeleteAsync(id);
        }

        public async Task<(List<User> Users, int TotalCount)> Search(string keyword, string? role, string? status, int page, int pageSize)
        {
            return await _userRepository.SearchAsync(keyword, role, status, page, pageSize);
        }
    }
}
