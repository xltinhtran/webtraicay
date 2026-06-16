namespace BaseCore.DTO.AuthService;

public class RoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int UserType { get; set; }
}
