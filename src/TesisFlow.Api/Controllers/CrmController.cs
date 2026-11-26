using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TesisFlow.Core.Servicos.Atendimentos;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CrmController : ControllerBase
    {
        private readonly AtendimentoConsultar _consultar;
        private readonly AtendimentoSalvar _salvar;
        private readonly AtendimentoExcluir _excluir;
        private readonly EscolaCrmSalvar _escolaCrmSalvar;

        public CrmController(AtendimentoConsultar consultar, AtendimentoSalvar salvar, AtendimentoExcluir excluir, EscolaCrmSalvar escolaCrmSalvar)
        {
            _consultar = consultar;
            _salvar = salvar;
            _excluir = excluir;
            _escolaCrmSalvar = escolaCrmSalvar;
        }

        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] int? colegioId,
            [FromQuery] int? status,
            [FromQuery] string? busca,
            [FromQuery] int top = 20,
            [FromQuery] int skip = 0)
        {
            var (itens, total) = await _consultar.ObterAsync(colegioId, status, busca, top, skip);
            return Ok(new { itens, total });
        }

        [HttpGet("colegio/{colegioId}")]
        public async Task<IActionResult> GetPorColegio(int colegioId, [FromQuery] int top = 20, [FromQuery] int skip = 0)
        {
            var (itens, total) = await _consultar.ObterAsync(colegioId, null, null, top, skip);
            return Ok(new { itens, total });
        }

        [HttpGet("retornos/{usuarioId}")]
        public async Task<IActionResult> GetRetornos(int usuarioId)
        {
            var retornos = await _consultar.ObterRetornosAsync(usuarioId);
            return Ok(retornos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var atendimento = await _consultar.ObterPorIdAsync(id);
            if (atendimento == null) return NotFound();
            return Ok(atendimento);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] AtendimentoSalvarDTO dto)
        {
            var (usuarioId, usuarioNome) = UsuarioAtual();
            var atendimento = await _salvar.CriarAsync(dto, usuarioId, usuarioNome);

            await _escolaCrmSalvar.ObterOuCriarAsync(dto.ColegioId, dto.ColegioNome, usuarioId, usuarioNome, dto.ContatoId, dto.NomeContato);

            return Ok(atendimento);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] AtendimentoSalvarDTO dto)
        {
            try
            {
                var atendimento = await _salvar.AtualizarAsync(id, dto);
                return Ok(atendimento);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _excluir.ExcluirAsync(id);
                return Ok();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        private (int Id, string Nome) UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var nome = User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? string.Empty;
            return (int.TryParse(idStr, out var id) ? id : 0, nome);
        }
    }
}
