using Microsoft.AspNetCore.Mvc;
using SMS.API.DTOs;
using SMS.API.Services;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("sales")]
        public async Task<ActionResult<List<SalesReportItemDto>>> GetSalesReport(
            [FromQuery] DateOnly? fromDate,
            [FromQuery] DateOnly? toDate)
        {
            var data = await _reportService.GetSalesReportAsync(fromDate, toDate);
            return Ok(data);
        }
    }
}
