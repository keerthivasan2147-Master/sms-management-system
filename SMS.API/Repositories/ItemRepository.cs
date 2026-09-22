using Microsoft.EntityFrameworkCore;
using SMS.API.Data;
using SMS.API.Models;

namespace SMS.API.Repositories
{
    public interface IItemRepository : IRepository<Item>
    {
        Task<Item?> GetByCodeAsync(string code);
        Task<bool> ExistsAsync(string code);
    }

    public class ItemRepository : Repository<Item>, IItemRepository
    {
        public ItemRepository(SMSDbContext context) : base(context)
        {
        }

        public async Task<Item?> GetByCodeAsync(string code)
        {
            return await _dbSet.FirstOrDefaultAsync(i => i.Code.ToLower() == code.ToLower());
        }

        public async Task<bool> ExistsAsync(string code)
        {
            return await _dbSet.AnyAsync(i => i.Code.ToLower() == code.ToLower());
        }
    }
}
