using Microsoft.AspNetCore.Mvc;
using BaseCore.Common;
using BaseCore.Services.Authen;
using System.Text.RegularExpressions;
using System.Threading.Tasks;


namespace BaseCore.AuthService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private const string SecretKey = "YourSecretKeyForAuthenticationShouldBeLongEnough";
        private const int TokenExpirationMinutes = 480; // 8 hours

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var validationError = ValidateLoginRequest(request);
            if (!string.IsNullOrEmpty(validationError))
            {
                return BadRequest(new { message = validationError });
            }

            request.Username = request.Username.Trim();
            var user = await _userService.Authenticate(request.Username, request.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            // Generate JWT token
            var token = TokenHelper.GenerateToken(
                SecretKey,
                TokenExpirationMinutes,
                user.Id.ToString(),
                user.UserName,
                user.UserType == 1 ? "Admin" : "User"
            );

            return Ok(new LoginResponse
            {
                Token = token,
                UserId = user.Id.ToString(),
                Username = user.UserName,
                Name = user.Name,
                Email = user.Email,
                Role = user.UserType == 1 ? "Admin" : "User",
                ExpiresIn = TokenExpirationMinutes * 60
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var validationError = ValidateRegisterRequest(request);
            if (!string.IsNullOrEmpty(validationError))
            {
                return BadRequest(new { message = validationError });
            }

            try
            {
                var user = new BaseCore.Entities.User
                {
                    UserName = request.Username.Trim(),
                    Name = request.Name.Trim(),
                    Email = request.Email.Trim(),
                    Phone = request.Phone.Trim(),
                    UserType = 0 // Default to regular user
                };

                var createdUser = await _userService.Create(user, request.Password);

                return Ok(new { message = "Registration successful", userId = createdUser.Id });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = "Registration failed: " + ex.Message });
            }
        }

        private static string ValidateLoginRequest(LoginRequest request)
        {
            if (request == null)
            {
                return "Invalid request";
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return "Username is required";
            }

            if (request.Username.Trim().Length < 3 || request.Username.Trim().Length > 30)
            {
                return "Username must be between 3 and 30 characters";
            }

            if (!Regex.IsMatch(request.Username.Trim(), @"^[A-Za-z0-9_@.]+$"))
            {
                return "Username format is invalid";
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return "Password is required";
            }

            if (request.Password.Length < 6 || request.Password.Length > 50)
            {
                return "Password must be between 6 and 50 characters";
            }

            return string.Empty;
        }

        private static string ValidateRegisterRequest(RegisterRequest request)
        {
            if (request == null)
            {
                return "Invalid request";
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return "Name is required";
            }

            if (request.Name.Trim().Length < 2 || request.Name.Trim().Length > 60)
            {
                return "Name must be between 2 and 60 characters";
            }

            if (string.IsNullOrWhiteSpace(request.Username))
            {
                return "Username is required";
            }

            if (request.Username.Trim().Length < 3 || request.Username.Trim().Length > 30)
            {
                return "Username must be between 3 and 30 characters";
            }

            if (!Regex.IsMatch(request.Username.Trim(), @"^[A-Za-z0-9_@.]+$"))
            {
                return "Username format is invalid";
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return "Email is required";
            }

            if (request.Email.Trim().Length > 100 || !Regex.IsMatch(request.Email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$"))
            {
                return "Email format is invalid";
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return "Phone is required";
            }

            if (!Regex.IsMatch(request.Phone.Trim(), @"^(0|\+84)[0-9]{9,10}$"))
            {
                return "Phone format is invalid";
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return "Password is required";
            }

            if (request.Password.Length < 6 || request.Password.Length > 50)
            {
                return "Password must be between 6 and 50 characters";
            }

            if (!Regex.IsMatch(request.Password, @"[A-Za-z]") || !Regex.IsMatch(request.Password, @"[0-9]"))
            {
                return "Password must contain both letters and numbers";
            }

            return string.Empty;
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class LoginResponse
    {
        public string Token { get; set; }
        public string UserId { get; set; }
        public string Username { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public int ExpiresIn { get; set; }
    }

    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }
}
