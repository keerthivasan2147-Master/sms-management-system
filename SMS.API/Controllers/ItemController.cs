using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.DTOs;
using SMS.API.Models;
using SMS.API.Repositories;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ItemController : ControllerBase
    {
        private readonly IItemRepository _itemRepo;

        public ItemController(IItemRepository itemRepo)
        {
            _itemRepo = itemRepo;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ItemDto>>> GetAll()
        {
            var items = await _itemRepo.GetAllAsync();
            var dtos = items.Select(i => new ItemDto
            {
                Code = i.Code,
                Description = i.Description,
                ItemPhoto = i.ItemPhoto,
                Cost = i.Cost,
                SalesPrice = i.SalesPrice,
                Unit = i.Unit,
                Brand = i.Brand,
                Supplier = i.Supplier,
                CreatedAt = i.CreatedAt
            }).OrderBy(i => i.Description);

            return Ok(dtos);
        }

        [HttpGet("{code}")]
        public async Task<ActionResult<ItemDto>> GetByCode(string code)
        {
            var i = await _itemRepo.GetByCodeAsync(code);
            if (i == null)
            {
                return NotFound(new { message = $"Item with code '{code}' not found." });
            }

            return Ok(new ItemDto
            {
                Code = i.Code,
                Description = i.Description,
                ItemPhoto = i.ItemPhoto,
                Cost = i.Cost,
                SalesPrice = i.SalesPrice,
                Unit = i.Unit,
                Brand = i.Brand,
                Supplier = i.Supplier,
                CreatedAt = i.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<ItemDto>> Create([FromBody] CreateItemDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (await _itemRepo.ExistsAsync(dto.Code.Trim()))
            {
                return Conflict(new { message = $"Item with code '{dto.Code}' already exists." });
            }

            var item = new Item
            {
                Code = dto.Code.Trim().ToUpper(),
                Description = dto.Description.Trim(),
                ItemPhoto = dto.ItemPhoto,
                Cost = dto.Cost,
                SalesPrice = dto.SalesPrice,
                Unit = dto.Unit.Trim().ToUpper(),
                Brand = dto.Brand.Trim(),
                Supplier = dto.Supplier.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _itemRepo.AddAsync(item);
            await _itemRepo.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByCode), new { code = item.Code }, new ItemDto
            {
                Code = item.Code,
                Description = item.Description,
                ItemPhoto = item.ItemPhoto,
                Cost = item.Cost,
                SalesPrice = item.SalesPrice,
                Unit = item.Unit,
                Brand = item.Brand,
                Supplier = item.Supplier,
                CreatedAt = item.CreatedAt
            });
        }

        [HttpPut("{code}")]
        public async Task<ActionResult<ItemDto>> Update(string code, [FromBody] UpdateItemDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var item = await _itemRepo.GetByCodeAsync(code);
            if (item == null)
            {
                return NotFound(new { message = $"Item with code '{code}' not found." });
            }

            item.Description = dto.Description.Trim();
            if (dto.ItemPhoto != null)
            {
                item.ItemPhoto = dto.ItemPhoto;
            }
            item.Cost = dto.Cost;
            item.SalesPrice = dto.SalesPrice;
            item.Unit = dto.Unit.Trim().ToUpper();
            item.Brand = dto.Brand.Trim();
            item.Supplier = dto.Supplier.Trim();

            _itemRepo.Update(item);
            await _itemRepo.SaveChangesAsync();

            return Ok(new ItemDto
            {
                Code = item.Code,
                Description = item.Description,
                ItemPhoto = item.ItemPhoto,
                Cost = item.Cost,
                SalesPrice = item.SalesPrice,
                Unit = item.Unit,
                Brand = item.Brand,
                Supplier = item.Supplier,
                CreatedAt = item.CreatedAt
            });
        }

        [HttpDelete("{code}")]
        public async Task<ActionResult> Delete(string code)
        {
            var item = await _itemRepo.GetByCodeAsync(code);
            if (item == null)
            {
                return NotFound(new { message = $"Item with code '{code}' not found." });
            }

            _itemRepo.Remove(item);
            try
            {
                await _itemRepo.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Cannot delete item because it is referenced in sales invoices.", error = ex.Message });
            }
        }
    }
}
