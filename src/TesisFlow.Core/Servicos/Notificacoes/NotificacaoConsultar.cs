using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;

namespace TesisFlow.Core.Servicos.Notificacoes
{
    public class NotificacaoConsultar
    {
        private readonly INotificacaoRepositorio _repositorio;

        public NotificacaoConsultar(INotificacaoRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<NotificacaoDTO>> ObterPorUsuarioAsync(int usuarioId)
        {
            var notificacoes = await _repositorio.ObterPorUsuarioAsync(usuarioId);
            return notificacoes.Select(MapToDTO);
        }

        private static NotificacaoDTO MapToDTO(Modelo.Entidades.Notificacao n) => new()
        {
            Id = n.Id,
            Titulo = n.Titulo,
            Descricao = n.Descricao,
            Tipo = n.Tipo,
            Link = n.Link,
            Lida = n.Lida,
            DataCriacao = n.DataCriacao,
            TargetUserId = n.TargetUserId,
        };
    }
}
