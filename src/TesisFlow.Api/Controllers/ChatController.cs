using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TesisFlow.Api.Hubs;
using TesisFlow.Core.Servicos.Mensagens;
using TesisFlow.Core.Servicos.Usuarios;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private const long TamanhoMaximoAudio = 10 * 1024 * 1024;
        private const long TamanhoMaximoImagem = 5 * 1024 * 1024;

        private static readonly HashSet<string> ExtensoesImagemPermitidas = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
        };

        private readonly MensagemConsultar _consultar;
        private readonly MensagemSalvar _salvar;
        private readonly UsuarioConsultar _usuarioConsultar;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly IWebHostEnvironment _env;

        public ChatController(MensagemConsultar consultar, MensagemSalvar salvar, UsuarioConsultar usuarioConsultar, IHubContext<ChatHub> hubContext, IWebHostEnvironment env)
        {
            _consultar = consultar;
            _salvar = salvar;
            _usuarioConsultar = usuarioConsultar;
            _hubContext = hubContext;
            _env = env;
        }

        [HttpGet("conversas/{usuarioId}")]
        public async Task<IActionResult> GetContatos(int usuarioId)
        {
            var contatos = await _consultar.ObterContatosAsync(usuarioId);
            return Ok(contatos.OrderByDescending(c => c.UltimaData));
        }

        [HttpGet("conversas/{usuarioA}/{usuarioB}")]
        public async Task<IActionResult> GetHistorico(int usuarioA, int usuarioB, [FromQuery] int? antesId = null, [FromQuery] int limite = 50)
        {
            var mensagens = await _consultar.ObterConversaAsync(usuarioA, usuarioB, antesId, limite);
            return Ok(mensagens);
        }

        [HttpGet("buscar/{usuarioId}")]
        public async Task<IActionResult> Buscar(int usuarioId, [FromQuery] string termo, [FromQuery] int? contatoId = null)
        {
            if (string.IsNullOrWhiteSpace(termo) || termo.Trim().Length < 2)
                return Ok(new List<MensagemBuscaDTO>());

            var resultados = await _consultar.BuscarAsync(usuarioId, termo.Trim(), contatoId);
            return Ok(resultados);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] MensagemSalvarDTO dto)
        {
            var mensagem = await _salvar.EnviarAsync(dto.Texto, dto.RemetenteId, dto.DestinatarioId, dto.MensagemRespondidaId, dto.Vinculo);
            var mensagemDto = await MontarDtoAsync(mensagem);

            await _hubContext.Clients.Group($"user_{dto.DestinatarioId}").SendAsync("ReceberMensagem", mensagemDto);
            await _hubContext.Clients.Group($"user_{dto.RemetenteId}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        [HttpPost("audio")]
        [RequestSizeLimit(TamanhoMaximoAudio)]
        public async Task<IActionResult> PostAudio([FromForm] IFormFile? audio, [FromForm] int remetenteId, [FromForm] int destinatarioId, [FromForm] int duracao, [FromForm] int? mensagemRespondidaId)
        {
            if (audio == null || audio.Length == 0)
                return BadRequest(new { mensagem = "Áudio inválido." });

            if (audio.Length > TamanhoMaximoAudio)
                return BadRequest(new { mensagem = "O áudio deve ter no máximo 10MB." });

            if (!audio.ContentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { mensagem = "Formato de áudio não suportado." });

            if (duracao < 1) duracao = 1;

            var diretorio = Path.Combine(_env.ContentRootPath, "uploads", "chat");
            Directory.CreateDirectory(diretorio);

            var nomeArquivo = $"{remetenteId}_{Guid.NewGuid():N}.webm";
            var caminho = Path.Combine(diretorio, nomeArquivo);

            using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await audio.CopyToAsync(stream);
            }

            var mensagem = await _salvar.EnviarAudioAsync(remetenteId, destinatarioId, $"/api/Chat/audio?f={nomeArquivo}", duracao, mensagemRespondidaId);
            var mensagemDto = await MontarDtoAsync(mensagem);

            await _hubContext.Clients.Group($"user_{destinatarioId}").SendAsync("ReceberMensagem", mensagemDto);
            await _hubContext.Clients.Group($"user_{remetenteId}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        [HttpPost("imagem")]
        [RequestSizeLimit(TamanhoMaximoImagem)]
        public async Task<IActionResult> PostImagem([FromForm] IFormFile? arquivo, [FromForm] int remetenteId, [FromForm] int destinatarioId, [FromForm] int? mensagemRespondidaId)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { mensagem = "Imagem inválida." });

            if (arquivo.Length > TamanhoMaximoImagem)
                return BadRequest(new { mensagem = "A imagem deve ter no máximo 5MB." });

            var extensao = Path.GetExtension(arquivo.FileName);
            if (!arquivo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                !ExtensoesImagemPermitidas.Contains(extensao))
                return BadRequest(new { mensagem = "Formato de imagem não suportado." });

            var diretorio = Path.Combine(_env.ContentRootPath, "uploads", "chat");
            Directory.CreateDirectory(diretorio);

            var nomeArquivo = $"{remetenteId}_{Guid.NewGuid():N}{extensao}";
            var caminho = Path.Combine(diretorio, nomeArquivo);

            using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            var mensagem = await _salvar.EnviarImagemAsync(remetenteId, destinatarioId, $"/api/Chat/imagem?f={nomeArquivo}", arquivo.FileName, mensagemRespondidaId);
            var mensagemDto = await MontarDtoAsync(mensagem);

            await _hubContext.Clients.Group($"user_{destinatarioId}").SendAsync("ReceberMensagem", mensagemDto);
            await _hubContext.Clients.Group($"user_{remetenteId}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        private async Task<MensagemDTO> MontarDtoAsync(Mensagem mensagem)
        {
            var remetente = await _usuarioConsultar.ObterPorIdAsync(mensagem.RemetenteId);

            MensagemRespostaDTO? resposta = null;
            if (mensagem.MensagemRespondidaId.HasValue)
            {
                var respondida = await _consultar.ObterPorIdAsync(mensagem.MensagemRespondidaId.Value);
                if (respondida != null)
                {
                    resposta = new MensagemRespostaDTO
                    {
                        Id = respondida.Id,
                        Texto = respondida.Texto,
                        Audio = respondida.Audio,
                        Imagem = respondida.Imagem,
                        RemetenteNome = respondida.RemetenteNome,
                    };
                }
            }

            return new MensagemDTO
            {
                Id = mensagem.Id,
                RemetenteId = mensagem.RemetenteId,
                RemetenteNome = remetente?.Nome ?? "",
                RemetenteFoto = remetente?.Foto,
                DestinatarioId = mensagem.DestinatarioId,
                Texto = mensagem.Texto,
                Lida = mensagem.Lida,
                Entregue = mensagem.Entregue,
                DataCriacao = mensagem.DataCriacao.Kind == DateTimeKind.Utc
                    ? mensagem.DataCriacao
                    : DateTime.SpecifyKind(mensagem.DataCriacao, DateTimeKind.Utc),
                Audio = mensagem.Audio,
                AudioDuracao = mensagem.AudioDuracao,
                Imagem = mensagem.Imagem,
                ImagemNome = mensagem.ImagemNome,
                MensagemRespondidaId = mensagem.MensagemRespondidaId,
                MensagemRespondida = resposta,
                Vinculo = string.IsNullOrEmpty(mensagem.VinculoTipo) ? null : new VinculoDTO
                {
                    Tipo = mensagem.VinculoTipo!,
                    Id = mensagem.VinculoId ?? 0,
                    Titulo = mensagem.VinculoTitulo ?? "",
                    Subtitulo = mensagem.VinculoSubtitulo ?? "",
                    Link = mensagem.VinculoLink ?? "",
                    Icone = mensagem.VinculoIcone ?? "",
                },
            };
        }

        [HttpGet("audio")]
        public IActionResult ObterAudio([FromQuery] string? f)
        {
            if (string.IsNullOrWhiteSpace(f))
                return NotFound();

            var nomeArquivo = Path.GetFileName(f);
            var caminho = Path.Combine(_env.ContentRootPath, "uploads", "chat", nomeArquivo);

            if (!System.IO.File.Exists(caminho)) return NotFound();
            return PhysicalFile(caminho, "audio/webm");
        }

        [HttpGet("imagem")]
        public IActionResult ObterImagem([FromQuery] string? f, [FromQuery] string? download)
        {
            if (string.IsNullOrWhiteSpace(f))
                return NotFound();

            var nomeArquivo = Path.GetFileName(f);
            var caminho = Path.Combine(_env.ContentRootPath, "uploads", "chat", nomeArquivo);

            if (!System.IO.File.Exists(caminho)) return NotFound();

            var tipo = Path.GetExtension(nomeArquivo).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => "image/png",
            };

            if (!string.IsNullOrEmpty(download))
            {
                return PhysicalFile(caminho, tipo, $"imagem{Path.GetExtension(nomeArquivo)}");
            }

            return PhysicalFile(caminho, tipo);
        }

        [HttpPut("lidas/{remetenteId}/{destinatarioId}")]
        public async Task<IActionResult> MarcarLidas(int remetenteId, int destinatarioId)
        {
            await _salvar.MarcarComoLidasAsync(remetenteId, destinatarioId);

            await _hubContext.Clients
                .Group($"user_{remetenteId}")
                .SendAsync("MensagensLidas", destinatarioId);

            return Ok();
        }
    }
}
