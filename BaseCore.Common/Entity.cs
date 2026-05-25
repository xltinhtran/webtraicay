using System;
using System.ComponentModel.DataAnnotations;

namespace BaseCore.Common
{
    // Thêm <TKey> để linh hoạt kiểu dữ liệu của Id
    public class Entity<TKey>
    {
        [Key] // Đánh dấu đây là khóa chính cho EF Core
        public TKey Id { get; set; }

        public DateTime CreatedDateTime { get; set; } = DateTime.Now; // Đổi thành DateTime.Now cho thực tế
        public string CreatedUser { get; set; } = string.Empty;
    }

    // Nếu bạn muốn giữ lại class Entity không có generic để không phải sửa code cũ quá nhiều, 
    // bạn có thể tách phần Audit (Created...) ra riêng:
    public class Entity : Entity<string>
    {
        // Mặc định nếu gọi Entity thì Id sẽ là string và tự sinh Guid
        public Entity()
        {
            Id = Guid.NewGuid().ToString();
        }
    }
}