using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Mensagens
{
    public class MensagemSalvar
    {
        private readonly IMensagemRepositorio _repositorio;

        public MensagemSalvar(IMensagemRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<Mensagem> EnviarAsync(string texto, int remetenteId, int destinatarioId)
        {
            var mensagem = new Mensagem
            {
                Texto = texto,
                RemetenteId = remetenteId,
                DestinatarioId = destinatarioId,
                Lida = false,
            };

            return await _repositorio.AdicionarAsync(mensagem);
        }

        public async Task<List<int>> MarcarComoLidasAsync(int remetenteId, int destinatarioId)
        {
            return await _repositorio.MarcarComoLidasAsync(remetenteId, destinatarioId);
        }

        public async Task<int?> MarcarEntregueAsync(int mensagemId, int destinatarioId)
        {
            return await _repositorio.MarcarEntregueAsync(mensagemId, destinatarioId);
        }
    }
}
