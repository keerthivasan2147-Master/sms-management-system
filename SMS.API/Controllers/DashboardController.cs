using Microsoft.AspNetCore.Mvc;
using SMS.API.DTOs;
using SMS.API.Services;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IReportService _reportService;

        public DashboardController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<DashboardSummaryDto>> GetSummary()
        {
            var summary = await _reportService.GetDashboardSummaryAsync();
            return Ok(summary);
        }
    }
}
