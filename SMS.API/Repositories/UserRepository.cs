using Microsoft.EntityFrameworkCore;
using SMS.API.Data;
using SMS.API.Models;

namespace SMS.API.Repositories
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByUsernameAsync(string username);
    }

    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(SMSDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByUsernameAsync(string username)
        {
            return await _dbSet.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        }
    }
}
