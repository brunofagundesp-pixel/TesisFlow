using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

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

        public async Task<IEnumerable<MensagemDTO>> ObterConversaAsync(int usuarioA, int usuarioB, int? antesId = null, int limite = 50)
        {
            var mensagens = await _repositorio.ObterConversaAsync(usuarioA, usuarioB, antesId, limite);
            return mensagens.OrderBy(m => m.DataCriacao).Select(m => new MensagemDTO
            {
                Id = m.Id,
                RemetenteId = m.RemetenteId,
                RemetenteNome = m.Remetente?.Nome ?? "",
                RemetenteFoto = m.Remetente?.Foto,
                DestinatarioId = m.DestinatarioId,
                Texto = m.Texto,
                Lida = m.Lida,
                Entregue = m.Entregue,
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
            });
        }

        public async Task<MensagemDTO?> ObterPorIdAsync(int id)
        {
            var m = await _repositorio.ObterPorIdAsync(id);
            if (m == null) return null;

            return new MensagemDTO
            {
                Id = m.Id,
                RemetenteId = m.RemetenteId,
                RemetenteNome = m.Remetente?.Nome ?? "",
                RemetenteFoto = m.Remetente?.Foto,
                DestinatarioId = m.DestinatarioId,
                Texto = m.Texto,
                Lida = m.Lida,
                Entregue = m.Entregue,
                DataCriacao = ComoUtc(m.DataCriacao),
                Audio = m.Audio,
                AudioDuracao = m.AudioDuracao,
            };
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
                        UltimaMensagem = !string.IsNullOrEmpty(m.Audio) ? "[Áudio]" : !string.IsNullOrEmpty(m.Imagem) ? "[Imagem]" : !string.IsNullOrEmpty(m.VinculoTipo) ? "[Tarefa]" : m.Texto,
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
    }
}
