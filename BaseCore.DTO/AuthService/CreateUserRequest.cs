namespace BaseCore.DTO.AuthService;

public class CreateUserRequest
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Position { get; set; } = "";
    public bool IsActive { get; set; }
    public int UserType { get; set; }
}
