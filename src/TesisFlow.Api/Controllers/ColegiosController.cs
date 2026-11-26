using System.Text;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Integracoes;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ColegiosController : ControllerBase
    {
        private readonly TesisCcService _tesisCcService;

        public ColegiosController(TesisCcService tesisCcService)
        {
            _tesisCcService = tesisCcService;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] int? top,
            [FromQuery] int? skip,
            [FromQuery] string? situacao,
            [FromQuery] string? busca,
            [FromQuery] string? uf,
            [FromQuery] string? municipio)
        {
            var (itens, total) = await _tesisCcService.ListarColegiosAsync(top, skip, situacao, busca, uf, municipio);

            if (top.HasValue)
                return Ok(new { itens, total });

            return Ok(itens);
        }

        [HttpGet("filtros")]
        public async Task<IActionResult> Filtros()
        {
            var (estados, cidadesPorEstado) = await _tesisCcService.ListarFiltrosAsync();
            return Ok(new { estados, cidadesPorEstado });
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export(
            [FromQuery] string? situacao,
            [FromQuery] string? busca,
            [FromQuery] string? uf,
            [FromQuery] string? municipio)
        {
            var itens = await _tesisCcService.ListarTodosFiltradosAsync(situacao, busca, uf, municipio);

            var sb = new StringBuilder();
            sb.AppendLine("Nome;Apelido;Situacao;Cidade;Estado;Contato;Telefone");

            foreach (var c in itens)
            {
                var situacaoValor = string.IsNullOrWhiteSpace(c.Situacao) ? c.Status : c.Situacao;

                sb.AppendLine(string.Join(';',
                    EscaparCsv(c.Nome),
                    EscaparCsv(c.Apelido),
                    EscaparCsv(situacaoValor),
                    EscaparCsv(c.Cidade),
                    EscaparCsv(c.Estado),
                    EscaparCsv(c.Contato),
                    EscaparCsv(c.Telefone)));
            }

            var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
            return File(bytes, "text/csv", "escolas.csv");
        }

        private static string EscaparCsv(string? valor)
        {
            var v = valor ?? string.Empty;
            if (v.Contains(';') || v.Contains('"') || v.Contains('\n') || v.Contains('\r'))
                return "\"" + v.Replace("\"", "\"\"") + "\"";
            return v;
        }
    }
}
