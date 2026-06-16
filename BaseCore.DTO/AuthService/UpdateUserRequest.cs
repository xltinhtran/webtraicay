namespace BaseCore.DTO.AuthService;

public class UpdateUserRequest
{
    public string? Password { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Position { get; set; }
    public int? UserType { get; set; }
    public bool? IsActive { get; set; }
}
