using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using TesisFlow.Api.Hubs;
using TesisFlow.Api.Services;
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
        private readonly CaminhosService _caminhos;

        public ChatController(MensagemConsultar consultar, MensagemSalvar salvar, UsuarioConsultar usuarioConsultar, IHubContext<ChatHub> hubContext, CaminhosService caminhos)
        {
            _consultar = consultar;
            _salvar = salvar;
            _usuarioConsultar = usuarioConsultar;
            _hubContext = hubContext;
            _caminhos = caminhos;
        }

        [HttpGet("conversas/{usuarioId}")]
        public async Task<IActionResult> GetContatos(int usuarioId)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();

            var contatos = await _consultar.ObterContatosAsync(usuarioId);
            return Ok(contatos.OrderByDescending(c => c.UltimaData));
        }

        [HttpGet("conversas/{usuarioA}/{usuarioB}")]
        public async Task<IActionResult> GetHistorico(int usuarioA, int usuarioB, [FromQuery] int? antesId = null, [FromQuery] int limite = 50)
        {
            if (usuarioA != UsuarioAtual()) return Forbid();

            var mensagens = await _consultar.ObterConversaAsync(usuarioA, usuarioB, antesId, limite);
            return Ok(mensagens);
        }

        [HttpGet("buscar/{usuarioId}")]
        public async Task<IActionResult> Buscar(int usuarioId, [FromQuery] string termo, [FromQuery] int? contatoId = null)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();
            if (string.IsNullOrWhiteSpace(termo) || termo.Trim().Length < 2)
                return Ok(new List<MensagemBuscaDTO>());

            var resultados = await _consultar.BuscarAsync(usuarioId, termo.Trim(), contatoId);
            return Ok(resultados);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] MensagemSalvarDTO dto)
        {
            if (dto.RemetenteId != UsuarioAtual()) return Forbid();

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
            if (remetenteId != UsuarioAtual()) return Forbid();
            if (audio == null || audio.Length == 0)
                return BadRequest(new { mensagem = "Áudio inválido." });

            if (audio.Length > TamanhoMaximoAudio)
                return BadRequest(new { mensagem = "O áudio deve ter no máximo 10MB." });

            if (!audio.ContentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { mensagem = "Formato de áudio não suportado." });

            if (duracao < 1) duracao = 1;

            var diretorio = Path.Combine(_caminhos.UploadsBasePath, "chat");
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

        [HttpGet("grupos/{usuarioId}")]
        public async Task<IActionResult> GetGrupos(int usuarioId)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();

            var grupos = await _consultar.ObterGruposAsync(usuarioId);
            return Ok(grupos);
        }

        [HttpGet("grupo/{usuarioId}/{grupoId}")]
        public async Task<IActionResult> GetConversaGrupo(int usuarioId, int grupoId, [FromQuery] int? antesId = null, [FromQuery] int limite = 50)
        {
            if (usuarioId != UsuarioAtual()) return Forbid();

            var mensagens = await _consultar.ObterConversaGrupoAsync(usuarioId, grupoId, antesId, limite);
            return Ok(mensagens);
        }

        [HttpPost("grupo")]
        public async Task<IActionResult> PostGrupo([FromBody] GrupoCriarDTO dto)
        {
            if (dto.RemetenteId != UsuarioAtual()) return Forbid();

            var ids = dto.ParticipanteIds.Where(id => id != dto.RemetenteId).Distinct().ToList();

            var grupo = await _salvar.CriarGrupoAsync(dto.RemetenteId, dto.Nome, ids);
            var todos = new List<int> { dto.RemetenteId };
            todos.AddRange(ids);

            Mensagem? mensagem = null;
            if (!string.IsNullOrWhiteSpace(dto.Texto))
            {
                mensagem = await _salvar.EnviarGrupoAsync(dto.RemetenteId, grupo.Id, dto.Texto);
            }

            var grupoDto = await MontarGrupoDtoAsync(grupo, todos, mensagem);

            foreach (var id in todos)
                await _hubContext.Clients.Group($"user_{id}").SendAsync("ReceberGrupo", grupoDto);

            if (mensagem != null)
            {
                var mensagemDto = await _consultar.ObterDtoAsync(mensagem.Id);
                foreach (var id in todos)
                    await _hubContext.Clients.Group($"user_{id}").SendAsync("ReceberMensagem", mensagemDto);
            }

            return Ok(new { grupo = grupoDto, mensagemId = mensagem?.Id });
        }

        [HttpPost("grupo/{grupoId}/mensagem")]
        public async Task<IActionResult> PostMensagemGrupo(int grupoId, [FromBody] GrupoEnviarDTO dto)
        {
            if (dto.RemetenteId != UsuarioAtual()) return Forbid();

            var grupo = await _salvar.ObterGrupoAsync(grupoId);
            if (grupo == null || !grupo.Participantes.Any(p => p.Ativo && p.UsuarioId == dto.RemetenteId))
                return Forbid();

            var mensagem = await _salvar.EnviarGrupoAsync(dto.RemetenteId, grupoId, dto.Texto, dto.MensagemRespondidaId, dto.Vinculo);
            var mensagemDto = await _consultar.ObterDtoParaGrupoAsync(mensagem.Id, grupo);

            var ids = grupo.Participantes.Where(p => p.Ativo).Select(p => p.UsuarioId).ToList();

            foreach (var id in ids)
                await _hubContext.Clients.Group($"user_{id}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        [HttpPost("grupo/{grupoId}/audio")]
        [RequestSizeLimit(TamanhoMaximoAudio)]
        public async Task<IActionResult> PostAudioGrupo(int grupoId, [FromForm] IFormFile? audio, [FromForm] int remetenteId, [FromForm] int duracao)
        {
            if (remetenteId != UsuarioAtual()) return Forbid();
            if (!await _consultar.UsuarioEhParticipanteAsync(grupoId, remetenteId))
                return Forbid();

            if (audio == null || audio.Length == 0)
                return BadRequest(new { mensagem = "Áudio inválido." });

            if (audio.Length > TamanhoMaximoAudio)
                return BadRequest(new { mensagem = "O áudio deve ter no máximo 10MB." });

            if (!audio.ContentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { mensagem = "Formato de áudio não suportado." });

            if (duracao < 1) duracao = 1;

            var diretorio = Path.Combine(_caminhos.UploadsBasePath, "chat");
            Directory.CreateDirectory(diretorio);

            var nomeArquivo = $"{remetenteId}_{Guid.NewGuid():N}.webm";
            var caminho = Path.Combine(diretorio, nomeArquivo);

            using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await audio.CopyToAsync(stream);
            }

            var mensagem = await _salvar.EnviarAudioGrupoAsync(remetenteId, grupoId, $"/api/Chat/audio?f={nomeArquivo}", duracao);
            var mensagemDto = await _consultar.ObterDtoAsync(mensagem.Id);

            var grupo = await _salvar.ObterGrupoAsync(grupoId);
            var ids = grupo?.Participantes.Where(p => p.Ativo).Select(p => p.UsuarioId).ToList() ?? new List<int>();

            foreach (var id in ids)
                await _hubContext.Clients.Group($"user_{id}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        [HttpPost("grupo/{grupoId}/imagem")]
        [RequestSizeLimit(TamanhoMaximoImagem)]
        public async Task<IActionResult> PostImagemGrupo(int grupoId, [FromForm] IFormFile? arquivo, [FromForm] int remetenteId)
        {
            if (remetenteId != UsuarioAtual()) return Forbid();
            if (!await _consultar.UsuarioEhParticipanteAsync(grupoId, remetenteId))
                return Forbid();

            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { mensagem = "Imagem inválida." });

            if (arquivo.Length > TamanhoMaximoImagem)
                return BadRequest(new { mensagem = "A imagem deve ter no máximo 5MB." });

            var extensao = Path.GetExtension(arquivo.FileName);
            if (!arquivo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                !ExtensoesImagemPermitidas.Contains(extensao))
                return BadRequest(new { mensagem = "Formato de imagem não suportado." });

            var diretorio = Path.Combine(_caminhos.UploadsBasePath, "chat");
            Directory.CreateDirectory(diretorio);

            var nomeArquivo = $"{remetenteId}_{Guid.NewGuid():N}{extensao}";
            var caminho = Path.Combine(diretorio, nomeArquivo);

            using (var stream = new FileStream(caminho, FileMode.Create))
            {
                await arquivo.CopyToAsync(stream);
            }

            var mensagem = await _salvar.EnviarImagemGrupoAsync(remetenteId, grupoId, $"/api/Chat/imagem?f={nomeArquivo}", arquivo.FileName);
            var mensagemDto = await _consultar.ObterDtoAsync(mensagem.Id);

            var grupo = await _salvar.ObterGrupoAsync(grupoId);
            var ids = grupo?.Participantes.Where(p => p.Ativo).Select(p => p.UsuarioId).ToList() ?? new List<int>();

            foreach (var id in ids)
                await _hubContext.Clients.Group($"user_{id}").SendAsync("ReceberMensagem", mensagemDto);

            return Ok(mensagemDto);
        }

        [HttpPut("grupo/lidas/{grupoId}/{usuarioId}")]
        public async Task<IActionResult> MarcarGrupoLidas(int grupoId, int usuarioId)
        {
            var ids = await _salvar.MarcarGrupoLidasAsync(grupoId, usuarioId);
            if (ids.Count > 0)
            {
                var grupo = await _salvar.ObterGrupoAsync(grupoId);
                var participantes = grupo?.Participantes.Select(p => p.UsuarioId).ToList() ?? new List<int>();

                foreach (var id in participantes.Where(p => p != usuarioId))
                    await _hubContext.Clients.Group($"user_{id}").SendAsync("MensagensGrupoLidas", grupoId, usuarioId);
            }

            return Ok();
        }

        [HttpDelete("grupo/{grupoId}/participante/{usuarioId}")]
        public async Task<IActionResult> RemoverParticipante(int grupoId, int usuarioId, [FromQuery] int solicitanteId)
        {
            if (solicitanteId != UsuarioAtual()) return Forbid();

            var grupo = await _salvar.ObterGrupoAsync(grupoId);
            if (grupo == null) return NotFound();

            if (grupo.CriadorId != solicitanteId)
                return Forbid();

            if (usuarioId == grupo.CriadorId)
                return BadRequest(new { mensagem = "Não é possível remover o criador do grupo." });

            if (!await _consultar.UsuarioEhParticipanteAsync(grupoId, usuarioId))
                return NotFound();

            var removido = await _salvar.RemoverParticipanteAsync(grupoId, usuarioId);
            if (!removido) return NotFound();

            var ids = grupo.Participantes
                .Where(p => p.Ativo && p.UsuarioId != usuarioId)
                .Select(p => p.UsuarioId)
                .Append(usuarioId)
                .Distinct()
                .ToList();

            foreach (var id in ids)
                await _hubContext.Clients.Group($"user_{id}").SendAsync("ParticipanteRemovido", grupoId, usuarioId);

            return Ok();
        }

        [HttpPost("grupo/{grupoId}/participante")]
        public async Task<IActionResult> AdicionarParticipante(int grupoId, [FromBody] GrupoAdicionarParticipanteDTO dto)
        {
            if (dto.SolicitanteId != UsuarioAtual()) return Forbid();

            var grupo = await _salvar.ObterGrupoAsync(grupoId);
            if (grupo == null) return NotFound();

            if (grupo.CriadorId != dto.SolicitanteId)
                return Forbid();

            var adicionado = await _salvar.AdicionarParticipanteAsync(grupoId, dto.UsuarioId);
            if (!adicionado)
                return BadRequest(new { mensagem = "O usuário já é participante do grupo." });

            var novo = await _usuarioConsultar.ObterPorIdAsync(dto.UsuarioId);

            var ids = grupo.Participantes
                .Where(p => p.Ativo && p.UsuarioId != dto.UsuarioId)
                .Select(p => p.UsuarioId)
                .ToList();

            foreach (var id in ids)
                await _hubContext.Clients.Group($"user_{id}").SendAsync("ParticipanteAdicionado", grupoId,
                    new GrupoParticipanteDTO { UsuarioId = dto.UsuarioId, Nome = novo?.Nome ?? "", Foto = novo?.Foto });

            var grupoDto = await _consultar.ObterGrupoDtoAsync(grupoId);
            if (grupoDto != null)
                await _hubContext.Clients.Group($"user_{dto.UsuarioId}").SendAsync("ReceberGrupo", grupoDto);

            return Ok();
        }

        [HttpPost("imagem")]
        [RequestSizeLimit(TamanhoMaximoImagem)]
        public async Task<IActionResult> PostImagem([FromForm] IFormFile? arquivo, [FromForm] int remetenteId, [FromForm] int destinatarioId, [FromForm] int? mensagemRespondidaId)
        {
            if (remetenteId != UsuarioAtual()) return Forbid();
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { mensagem = "Imagem inválida." });

            if (arquivo.Length > TamanhoMaximoImagem)
                return BadRequest(new { mensagem = "A imagem deve ter no máximo 5MB." });

            var extensao = Path.GetExtension(arquivo.FileName);
            if (!arquivo.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ||
                !ExtensoesImagemPermitidas.Contains(extensao))
                return BadRequest(new { mensagem = "Formato de imagem não suportado." });

            var diretorio = Path.Combine(_caminhos.UploadsBasePath, "chat");
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
            var ids = new List<int> { mensagem.RemetenteId };
            if (mensagem.DestinatarioId.HasValue) ids.Add(mensagem.DestinatarioId.Value);

            var usuarios = await _usuarioConsultar.ObterVariosAsync(ids);
            usuarios.TryGetValue(mensagem.RemetenteId, out var remetente);
            UsuarioDTO? destinatario = null;
            if (mensagem.DestinatarioId.HasValue)
                usuarios.TryGetValue(mensagem.DestinatarioId.Value, out destinatario);

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
                DestinatarioNome = destinatario?.Nome ?? "",
                DestinatarioFoto = destinatario?.Foto,
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

        private async Task<GrupoChatDTO> MontarGrupoDtoAsync(GrupoChat grupo, IEnumerable<int> ids, Mensagem? ultima)
        {
            var participantes = new List<GrupoParticipanteDTO>();
            foreach (var id in ids)
            {
                var u = await _usuarioConsultar.ObterPorIdAsync(id);
                participantes.Add(new GrupoParticipanteDTO
                {
                    UsuarioId = id,
                    Nome = u?.Nome ?? "",
                    Foto = u?.Foto,
                });
            }

            return new GrupoChatDTO
            {
                GrupoId = grupo.Id,
                CriadorId = grupo.CriadorId,
                Nome = grupo.Nome,
                UltimaMensagem = ultima == null ? string.Empty : Resumo(ultima),
                UltimaData = ultima?.DataCriacao ?? grupo.DataCriacao,
                NaoLidas = 0,
                Participantes = participantes,
            };
        }

        private static string Resumo(Mensagem m) =>
            !string.IsNullOrEmpty(m.Audio) ? "[Áudio]" :
            !string.IsNullOrEmpty(m.Imagem) ? "[Imagem]" :
            !string.IsNullOrEmpty(m.VinculoTipo) ? "[Tarefa]" :
            m.Texto;

        [HttpGet("audio")]
        public IActionResult ObterAudio([FromQuery] string? f)
        {
            if (string.IsNullOrWhiteSpace(f))
                return NotFound();

            var nomeArquivo = Path.GetFileName(f);
            var caminho = Path.Combine(_caminhos.UploadsBasePath, "chat", nomeArquivo);

            if (!System.IO.File.Exists(caminho)) return NotFound();
            return PhysicalFile(caminho, "audio/webm");
        }

        [HttpGet("imagem")]
        public IActionResult ObterImagem([FromQuery] string? f, [FromQuery] string? download)
        {
            if (string.IsNullOrWhiteSpace(f))
                return NotFound();

            var nomeArquivo = Path.GetFileName(f);
            var caminho = Path.Combine(_caminhos.UploadsBasePath, "chat", nomeArquivo);

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

        private int UsuarioAtual()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(idStr, out var id) ? id : 0;
        }
    }
}
