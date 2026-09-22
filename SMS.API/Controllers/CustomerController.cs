using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.DTOs;
using SMS.API.Models;
using SMS.API.Repositories;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerRepository _customerRepo;

        public CustomerController(ICustomerRepository customerRepo)
        {
            _customerRepo = customerRepo;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerDto>>> GetAll()
        {
            var customers = await _customerRepo.GetAllAsync();
            var dtos = customers.Select(c => new CustomerDto
            {
                Code = c.Code,
                Name = c.Name,
                Address = c.Address,
                Mobile = c.Mobile,
                Email = c.Email,
                Category = c.Category,
                CreatedAt = c.CreatedAt
            }).OrderBy(c => c.Name);

            return Ok(dtos);
        }

        [HttpGet("{code}")]
        public async Task<ActionResult<CustomerDto>> GetByCode(string code)
        {
            var c = await _customerRepo.GetByCodeAsync(code);
            if (c == null)
            {
                return NotFound(new { message = $"Customer with code '{code}' not found." });
            }

            return Ok(new CustomerDto
            {
                Code = c.Code,
                Name = c.Name,
                Address = c.Address,
                Mobile = c.Mobile,
                Email = c.Email,
                Category = c.Category,
                CreatedAt = c.CreatedAt
            });
        }

        [HttpPost]
        public async Task<ActionResult<CustomerDto>> Create([FromBody] CreateCustomerDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (await _customerRepo.ExistsAsync(dto.Code.Trim()))
            {
                return Conflict(new { message = $"Customer with code '{dto.Code}' already exists." });
            }

            var customer = new Customer
            {
                Code = dto.Code.Trim().ToUpper(),
                Name = dto.Name.Trim(),
                Address = dto.Address.Trim(),
                Mobile = dto.Mobile.Trim(),
                Email = dto.Email.Trim().ToLower(),
                Category = dto.Category.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _customerRepo.AddAsync(customer);
            await _customerRepo.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByCode), new { code = customer.Code }, new CustomerDto
            {
                Code = customer.Code,
                Name = customer.Name,
                Address = customer.Address,
                Mobile = customer.Mobile,
                Email = customer.Email,
                Category = customer.Category,
                CreatedAt = customer.CreatedAt
            });
        }

        [HttpPut("{code}")]
        public async Task<ActionResult<CustomerDto>> Update(string code, [FromBody] UpdateCustomerDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var customer = await _customerRepo.GetByCodeAsync(code);
            if (customer == null)
            {
                return NotFound(new { message = $"Customer with code '{code}' not found." });
            }

            customer.Name = dto.Name.Trim();
            customer.Address = dto.Address.Trim();
            customer.Mobile = dto.Mobile.Trim();
            customer.Email = dto.Email.Trim().ToLower();
            customer.Category = dto.Category.Trim();

            _customerRepo.Update(customer);
            await _customerRepo.SaveChangesAsync();

            return Ok(new CustomerDto
            {
                Code = customer.Code,
                Name = customer.Name,
                Address = customer.Address,
                Mobile = customer.Mobile,
                Email = customer.Email,
                Category = customer.Category,
                CreatedAt = customer.CreatedAt
            });
        }

        [HttpDelete("{code}")]
        public async Task<ActionResult> Delete(string code)
        {
            var customer = await _customerRepo.GetByCodeAsync(code);
            if (customer == null)
            {
                return NotFound(new { message = $"Customer with code '{code}' not found." });
            }

            _customerRepo.Remove(customer);
            try
            {
                await _customerRepo.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Cannot delete customer because they have associated sales transactions.", error = ex.Message });
            }
        }
    }
}
