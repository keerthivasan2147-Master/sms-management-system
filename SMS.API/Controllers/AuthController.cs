using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.DTOs;
using SMS.API.Models;
using SMS.API.Repositories;
using SMS.API.Services;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _userRepo;
        private readonly ITokenService _tokenService;

        public AuthController(IUserRepository userRepo, ITokenService tokenService)
        {
            _userRepo = userRepo;
            _tokenService = tokenService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userRepo.GetByUsernameAsync(request.Username);
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            bool isPasswordValid = false;
            try
            {
                // Verify BCrypt hash
                isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
            }
            catch
            {
                // Fallback for plain text if any legacy test user
                isPasswordValid = (user.Password == request.Password);
            }

            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Invalid username or password." });
            }

            var token = _tokenService.GenerateToken(user);

            return Ok(new LoginResponseDto
            {
                Token = token,
                UserId = user.UserId,
                Name = user.Name,
                Username = user.Username,
                Role = user.Role,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            });
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var username = User.Identity?.Name;
            if (string.IsNullOrEmpty(username))
            {
                return Unauthorized();
            }

            var user = await _userRepo.GetByUsernameAsync(username);
            if (user == null)
            {
                return NotFound();
            }

            return Ok(new UserDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Username = user.Username,
                Mobile = user.Mobile,
                Role = user.Role
            });
        }

        [HttpPost("seed-admin")]
        public async Task<ActionResult> SeedAdmin()
        {
            var admin = await _userRepo.GetByUsernameAsync("admin");
            string hash = BCrypt.Net.BCrypt.HashPassword("Admin@123");

            if (admin == null)
            {
                admin = new User
                {
                    Name = "System Administrator",
                    Username = "admin",
                    Mobile = "+971-50-1234567",
                    Password = hash,
                    Role = "Admin"
                };
                await _userRepo.AddAsync(admin);
            }
            else
            {
                admin.Password = hash;
                _userRepo.Update(admin);
            }

            await _userRepo.SaveChangesAsync();
            return Ok(new { message = "Admin seeded successfully. Username: admin, Password: Admin@123" });
        }
    }
}
