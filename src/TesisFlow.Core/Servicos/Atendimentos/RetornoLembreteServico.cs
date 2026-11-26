using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Notificacoes;

namespace TesisFlow.Core.Servicos.Atendimentos
{
    public class RetornoLembreteServico
    {
        private static readonly TimeZoneInfo FusoSaoPaulo = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly NotificacaoServico _notificacaoServico;

        public RetornoLembreteServico(ApplicationDbContextTesisFlow context, NotificacaoServico notificacaoServico)
        {
            _context = context;
            _notificacaoServico = notificacaoServico;
        }

        public async Task ProcessarLembretesAsync()
        {
            var pendentes = await _context.Atendimentos
                .Where(a => a.Ativo && !a.RetornoConcluido && a.ProximoContatoData != null && a.LembreteNivel < 1)
                .ToListAsync();

            if (pendentes.Count == 0)
                return;

            var hojeSp = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, FusoSaoPaulo).Date;

            foreach (var atendimento in pendentes)
            {
                var data = atendimento.ProximoContatoData!.Value;
                var dataUtc = data.Kind == DateTimeKind.Utc ? data : DateTime.SpecifyKind(data, DateTimeKind.Utc);
                var dataSp = TimeZoneInfo.ConvertTimeFromUtc(dataUtc, FusoSaoPaulo).Date;

                if (dataSp > hojeSp)
                    continue;

                var atrasado = dataSp < hojeSp;
                var hora = string.IsNullOrWhiteSpace(atendimento.ProximoContatoHora)
                    ? string.Empty
                    : $" às {atendimento.ProximoContatoHora}";

                var titulo = atrasado
                    ? $"Retorno atrasado: {atendimento.ColegioNome}"
                    : $"Retorno hoje: {atendimento.ColegioNome}";

                var motivo = string.IsNullOrWhiteSpace(atendimento.ProximoContatoMotivo)
                    ? string.Empty
                    : $" • {atendimento.ProximoContatoMotivo}";

                var descricao = $"{atendimento.ColegioNome} • {dataSp:dd/MM/yyyy}{hora}{motivo}";

                await _notificacaoServico.CriarENotificarAsync(
                    titulo,
                    descricao,
                    "retorno",
                    $"/clientes/{atendimento.ColegioId}",
                    atendimento.UsuarioId);

                atendimento.LembreteNivel = 1;
            }

            await _context.SaveChangesAsync();
        }
    }
}
