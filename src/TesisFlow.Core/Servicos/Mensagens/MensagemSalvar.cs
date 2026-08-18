using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
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

        public async Task<Mensagem> EnviarAsync(string texto, int remetenteId, int destinatarioId, int? mensagemRespondidaId = null, VinculoSalvarDTO? vinculo = null)
        {
            var mensagem = new Mensagem
            {
                Texto = vinculo != null ? string.Empty : texto,
                RemetenteId = remetenteId,
                DestinatarioId = destinatarioId,
                Lida = false,
                MensagemRespondidaId = mensagemRespondidaId,
                VinculoTipo = vinculo?.Tipo,
                VinculoId = vinculo?.Id,
                VinculoTitulo = vinculo?.Titulo,
                VinculoSubtitulo = vinculo?.Subtitulo,
                VinculoLink = vinculo?.Link,
                VinculoIcone = vinculo?.Icone,
            };

            return await _repositorio.AdicionarAsync(mensagem);
        }

        public async Task<Mensagem> EnviarAudioAsync(int remetenteId, int destinatarioId, string audioUrl, int duracao, int? mensagemRespondidaId = null)
        {
            var mensagem = new Mensagem
            {
                Texto = string.Empty,
                RemetenteId = remetenteId,
                DestinatarioId = destinatarioId,
                Lida = false,
                Audio = audioUrl,
                AudioDuracao = duracao,
                MensagemRespondidaId = mensagemRespondidaId,
            };

            return await _repositorio.AdicionarAsync(mensagem);
        }

        public async Task<Mensagem> EnviarImagemAsync(int remetenteId, int destinatarioId, string imagemUrl, string imagemNome, int? mensagemRespondidaId = null)
        {
            var mensagem = new Mensagem
            {
                Texto = string.Empty,
                RemetenteId = remetenteId,
                DestinatarioId = destinatarioId,
                Lida = false,
                Imagem = imagemUrl,
                ImagemNome = imagemNome,
                MensagemRespondidaId = mensagemRespondidaId,
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
