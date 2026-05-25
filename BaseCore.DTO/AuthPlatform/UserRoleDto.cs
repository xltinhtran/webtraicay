namespace BaseCore.DTO.AuthPlatform
{
    public class UserRoleDto
    {
        // Đã xóa [BsonRepresentation(BsonType.ObjectId)]
        public string RoleId { get; set; }

        // Đã xóa [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; }

        public bool IsActive { get; set; }
    }
}