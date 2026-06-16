namespace BaseCore.DTO.AuthService;

public class UserResponse
{
    public string Id { get; set; } = "";
    public string Username { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Position { get; set; } = "";
    public bool IsActive { get; set; }
    public int UserType { get; set; }
    public DateTime Created { get; set; }
}
