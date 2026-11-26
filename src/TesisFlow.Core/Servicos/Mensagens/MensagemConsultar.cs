using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Mensagens
{
    public class MensagemConsultar
    {
        private readonly IMensagemRepositorio _repositorio;

        public MensagemConsultar(IMensagemRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        private static DateTime ComoUtc(DateTime data) =>
            data.Kind == DateTimeKind.Utc ? data : DateTime.SpecifyKind(data, DateTimeKind.Utc);

        private static string Resumo(Mensagem m) =>
            !string.IsNullOrEmpty(m.Audio) ? "[Áudio]" :
            !string.IsNullOrEmpty(m.Imagem) ? "[Imagem]" :
            !string.IsNullOrEmpty(m.VinculoTipo) ? "[Tarefa]" :
            m.Texto;

        private static MensagemDTO ParaDto(Mensagem m, string? grupoNome = null, int? totalParticipantes = null, int? lidaPor = null)
        {
            return new MensagemDTO
            {
                Id = m.Id,
                RemetenteId = m.RemetenteId,
                RemetenteNome = m.Remetente?.Nome ?? "",
                RemetenteFoto = m.Remetente?.Foto,
                DestinatarioId = m.DestinatarioId,
                DestinatarioNome = m.Destinatario?.Nome ?? "",
                DestinatarioFoto = m.Destinatario?.Foto,
                GrupoId = m.GrupoId,
                GrupoNome = grupoNome,
                Texto = m.Texto,
                Lida = m.Lida,
                Entregue = m.Entregue,
                LidaPor = lidaPor,
                TotalParticipantes = totalParticipantes,
                DataCriacao = ComoUtc(m.DataCriacao),
                Audio = m.Audio,
                AudioDuracao = m.AudioDuracao,
                Imagem = m.Imagem,
                ImagemNome = m.ImagemNome,
                MensagemRespondidaId = m.MensagemRespondidaId,
                MensagemRespondida = m.MensagemRespondida == null ? null : new MensagemRespostaDTO
                {
                    Id = m.MensagemRespondida.Id,
                    Texto = m.MensagemRespondida.Texto,
                    Audio = m.MensagemRespondida.Audio,
                    Imagem = m.MensagemRespondida.Imagem,
                    RemetenteNome = m.MensagemRespondida.Remetente?.Nome ?? "",
                },
                Vinculo = string.IsNullOrEmpty(m.VinculoTipo) ? null : new VinculoDTO
                {
                    Tipo = m.VinculoTipo!,
                    Id = m.VinculoId ?? 0,
                    Titulo = m.VinculoTitulo ?? "",
                    Subtitulo = m.VinculoSubtitulo ?? "",
                    Link = m.VinculoLink ?? "",
                    Icone = m.VinculoIcone ?? "",
                },
            };
        }

        public async Task<IEnumerable<MensagemDTO>> ObterConversaAsync(int usuarioA, int usuarioB, int? antesId = null, int limite = 50)
        {
            var mensagens = await _repositorio.ObterConversaAsync(usuarioA, usuarioB, antesId, limite);
            return mensagens.OrderBy(m => m.DataCriacao).Select(m => ParaDto(m));
        }

        public async Task<MensagemDTO?> ObterPorIdAsync(int id)
        {
            var m = await _repositorio.ObterPorIdAsync(id);
            if (m == null) return null;
            return ParaDto(m);
        }

        public async Task<MensagemDTO?> ObterDtoAsync(int id)
        {
            var m = await _repositorio.ObterPorIdAsync(id);
            if (m == null) return null;

            if (!m.GrupoId.HasValue)
                return ParaDto(m);

            var grupo = await _repositorio.ObterGrupoAsync(m.GrupoId.Value);
            var totalParticipantes = await _repositorio.ContarParticipantesGrupoAsync(m.GrupoId.Value);
            var leituras = await _repositorio.ObterContagemLeiturasGrupoAsync(m.GrupoId.Value);

            return ParaDto(m, grupo?.Nome, totalParticipantes, leituras.GetValueOrDefault(m.Id, 0));
        }

        public async Task<MensagemDTO?> ObterDtoParaGrupoAsync(int mensagemId, GrupoChat grupo)
        {
            var m = await _repositorio.ObterPorIdAsync(mensagemId);
            if (m == null) return null;

            var totalParticipantes = grupo.Participantes.Count(p => p.Ativo);
            return ParaDto(m, grupo.Nome, totalParticipantes, 0);
        }

        public async Task<IEnumerable<ContatoChatDTO>> ObterContatosAsync(int usuarioId)
        {
            var mensagens = await _repositorio.ObterConversasRecentesAsync(usuarioId);
            var contatosDict = new Dictionary<int, ContatoChatDTO>();

            foreach (var m in mensagens)
            {
                var outro = m.RemetenteId == usuarioId ? m.Destinatario : m.Remetente;
                if (outro == null) continue;

                if (!contatosDict.ContainsKey(outro.Id))
                {
                    contatosDict[outro.Id] = new ContatoChatDTO
                    {
                        UsuarioId = outro.Id,
                        Nome = outro.Nome,
                        Foto = outro.Foto,
                        UltimaMensagem = Resumo(m),
                        UltimaData = ComoUtc(m.DataCriacao),
                        NaoLidas = 0,
                    };
                }

                if (!m.Lida && m.DestinatarioId == usuarioId)
                    contatosDict[outro.Id].NaoLidas++;
            }

            return contatosDict.Values.OrderByDescending(c => c.UltimaData).ToList();
        }

        public async Task<IEnumerable<MensagemBuscaDTO>> BuscarAsync(int usuarioId, string termo, int? contatoId = null, int limite = 50)
        {
            var mensagens = await _repositorio.BuscarAsync(usuarioId, termo, contatoId, limite);
            return mensagens.Select(m =>
            {
                var outro = m.RemetenteId == usuarioId ? m.Destinatario : m.Remetente;
                return new MensagemBuscaDTO
                {
                    Id = m.Id,
                    RemetenteId = m.RemetenteId,
                    RemetenteNome = m.Remetente?.Nome ?? "",
                    DestinatarioId = m.DestinatarioId,
                    Texto = m.Texto,
                    DataCriacao = ComoUtc(m.DataCriacao),
                    ImagemNome = m.ImagemNome,
                    VinculoTitulo = m.VinculoTitulo,
                    ContatoId = outro?.Id ?? 0,
                    ContatoNome = outro?.Nome ?? "",
                    ContatoFoto = outro?.Foto,
                };
            });
        }

        public async Task<IEnumerable<GrupoChatDTO>> ObterGruposAsync(int usuarioId)
        {
            var grupos = await _repositorio.ObterGruposDoUsuarioAsync(usuarioId);
            var dtos = new List<GrupoChatDTO>();

            foreach (var g in grupos)
            {
                var naoLidas = await _repositorio.ContarNaoLidasGrupoAsync(g.Id, usuarioId);
                dtos.Add(await MontarGrupoDtoAsync(g, naoLidas));
            }

            return dtos.OrderByDescending(d => d.UltimaData).ToList();
        }

        public async Task<GrupoChatDTO?> ObterGrupoDtoAsync(int grupoId)
        {
            var grupo = await _repositorio.ObterGrupoAsync(grupoId);
            if (grupo == null) return null;
            return await MontarGrupoDtoAsync(grupo, 0);
        }

        private async Task<GrupoChatDTO> MontarGrupoDtoAsync(GrupoChat g, int naoLidas)
        {
            var ultima = await _repositorio.ObterUltimaMensagemGrupoAsync(g.Id);

            return new GrupoChatDTO
            {
                GrupoId = g.Id,
                CriadorId = g.CriadorId,
                Nome = g.Nome,
                UltimaMensagem = ultima == null ? string.Empty : Resumo(ultima),
                UltimaData = ultima == null ? ComoUtc(g.DataCriacao) : ComoUtc(ultima.DataCriacao),
                NaoLidas = naoLidas,
                Participantes = g.Participantes
                    .Where(p => p.Ativo)
                    .Select(p => new GrupoParticipanteDTO
                    {
                        UsuarioId = p.UsuarioId,
                        Nome = p.Usuario?.Nome ?? "",
                        Foto = p.Usuario?.Foto,
                    }).ToList(),
            };
        }

        public async Task<bool> UsuarioEhParticipanteAsync(int grupoId, int usuarioId)
        {
            return await _repositorio.UsuarioEhParticipanteAsync(grupoId, usuarioId);
        }

        public async Task<IEnumerable<MensagemDTO>> ObterConversaGrupoAsync(int usuarioId, int grupoId, int? antesId = null, int limite = 50)
        {
            if (!await _repositorio.UsuarioEhParticipanteAsync(grupoId, usuarioId))
                return Array.Empty<MensagemDTO>();

            var grupo = await _repositorio.ObterGrupoAsync(grupoId);
            var mensagens = await _repositorio.ObterConversaGrupoAsync(grupoId, antesId, limite);
            var totalParticipantes = await _repositorio.ContarParticipantesGrupoAsync(grupoId);
            var leituras = await _repositorio.ObterContagemLeiturasGrupoAsync(grupoId);

            return mensagens
                .OrderBy(m => m.DataCriacao)
                .Select(m => ParaDto(m, grupo?.Nome, totalParticipantes, leituras.GetValueOrDefault(m.Id, 0)));
        }
    }
}
