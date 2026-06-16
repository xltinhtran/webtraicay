namespace BaseCore.DTO.AuthService;

public class LoginResponse
{
    public string Token { get; set; } = "";
    public string UserId { get; set; } = "";
    public string Username { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role { get; set; } = "";
    public int ExpiresIn { get; set; }
}
