using Microsoft.EntityFrameworkCore;
using SMS.API.Data;
using SMS.API.Models;

namespace SMS.API.Repositories
{
    public interface ICustomerRepository : IRepository<Customer>
    {
        Task<Customer?> GetByCodeAsync(string code);
        Task<bool> ExistsAsync(string code);
    }

    public class CustomerRepository : Repository<Customer>, ICustomerRepository
    {
        public CustomerRepository(SMSDbContext context) : base(context)
        {
        }

        public async Task<Customer?> GetByCodeAsync(string code)
        {
            return await _dbSet.FirstOrDefaultAsync(c => c.Code.ToLower() == code.ToLower());
        }

        public async Task<bool> ExistsAsync(string code)
        {
            return await _dbSet.AnyAsync(c => c.Code.ToLower() == code.ToLower());
        }
    }
}
