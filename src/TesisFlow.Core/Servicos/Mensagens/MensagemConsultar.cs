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

        public async Task<IEnumerable<MensagemDTO>> ObterConversaAsync(int usuarioA, int usuarioB)
        {
            var mensagens = await _repositorio.ObterConversaAsync(usuarioA, usuarioB);
            return mensagens.OrderBy(m => m.DataCriacao).Select(m => new MensagemDTO
            {
                Id = m.Id,
                RemetenteId = m.RemetenteId,
                RemetenteNome = m.Remetente?.Nome ?? "",
                DestinatarioId = m.DestinatarioId,
                Texto = m.Texto,
                Lida = m.Lida,
                DataCriacao = m.DataCriacao,
            });
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
                        UltimaMensagem = m.Texto,
                        UltimaData = m.DataCriacao,
                        NaoLidas = 0,
                    };
                }

                if (!m.Lida && m.DestinatarioId == usuarioId)
                    contatosDict[outro.Id].NaoLidas++;
            }

            return contatosDict.Values.OrderByDescending(c => c.UltimaData).ToList();
        }
    }
}
