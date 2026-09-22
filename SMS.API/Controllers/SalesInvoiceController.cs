using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.DTOs;
using SMS.API.Services;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesInvoiceController : ControllerBase
    {
        private readonly ISalesInvoiceService _invoiceService;

        public SalesInvoiceController(ISalesInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpGet("{invoiceNumber}")]
        public async Task<ActionResult<SalesInvoiceDto>> GetByInvoiceNumber(string invoiceNumber)
        {
            var invoice = await _invoiceService.GetByInvoiceNumberAsync(invoiceNumber);
            if (invoice == null)
            {
                return NotFound(new { message = $"Invoice '{invoiceNumber}' not found." });
            }
            return Ok(invoice);
        }

        [HttpPost]
        public async Task<ActionResult<SalesInvoiceDto>> Create([FromBody] SaveSalesInvoiceDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var created = await _invoiceService.CreateInvoiceAsync(dto);
                return CreatedAtAction(nameof(GetByInvoiceNumber), new { invoiceNumber = created.InvoiceNumber }, created);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{invoiceNumber}")]
        public async Task<ActionResult<SalesInvoiceDto>> Update(string invoiceNumber, [FromBody] SaveSalesInvoiceDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var updated = await _invoiceService.UpdateInvoiceAsync(invoiceNumber, dto);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{invoiceNumber}")]
        public async Task<ActionResult> Delete(string invoiceNumber)
        {
            var deleted = await _invoiceService.DeleteInvoiceAsync(invoiceNumber);
            if (!deleted)
            {
                return NotFound(new { message = $"Invoice '{invoiceNumber}' not found." });
            }
            return NoContent();
        }

        // Navigation Endpoints
        [HttpGet("nav/top")]
        public async Task<ActionResult<NavigationResultDto>> GetTop()
        {
            var result = await _invoiceService.GetTopAsync();
            return Ok(result);
        }

        [HttpGet("nav/bottom")]
        public async Task<ActionResult<NavigationResultDto>> GetBottom()
        {
            var result = await _invoiceService.GetBottomAsync();
            return Ok(result);
        }

        [HttpGet("nav/prior/{currentInvoiceNumber}")]
        public async Task<ActionResult<NavigationResultDto>> GetPrior(string currentInvoiceNumber)
        {
            var result = await _invoiceService.GetPriorAsync(currentInvoiceNumber);
            return Ok(result);
        }

        [HttpGet("nav/next/{currentInvoiceNumber}")]
        public async Task<ActionResult<NavigationResultDto>> GetNext(string currentInvoiceNumber)
        {
            var result = await _invoiceService.GetNextAsync(currentInvoiceNumber);
            return Ok(result);
        }

        [HttpGet("nav/list")]
        public async Task<ActionResult<List<InvoiceSummaryDto>>> GetAllSummaries()
        {
            var list = await _invoiceService.GetAllSummariesAsync();
            return Ok(list);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<InvoiceSummaryDto>>> Search(
            [FromQuery] string? query,
            [FromQuery] DateOnly? fromDate,
            [FromQuery] DateOnly? toDate)
        {
            var list = await _invoiceService.SearchInvoicesAsync(query, fromDate, toDate);
            return Ok(list);
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<object>> GetNextNumber([FromQuery] string prefix = "INV")
        {
            var nextNumber = await _invoiceService.GetNextInvoiceNumberAsync(prefix);
            return Ok(new { nextNumber });
        }
    }
}
