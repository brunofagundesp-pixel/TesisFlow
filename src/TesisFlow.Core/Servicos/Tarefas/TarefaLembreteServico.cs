using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Servicos.Notificacoes;
using TesisFlow.Modelo.Enums;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaLembreteServico
    {
        private static readonly TimeZoneInfo FusoSaoPaulo = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly NotificacaoServico _notificacaoServico;

        public TarefaLembreteServico(ApplicationDbContextTesisFlow context, NotificacaoServico notificacaoServico)
        {
            _context = context;
            _notificacaoServico = notificacaoServico;
        }

        public async Task ProcessarLembretesAsync()
        {
            var agora = DateTime.UtcNow;

            var tarefas = await _context.Tarefas
                .Include(t => t.Projeto)
                .Where(t => t.Ativo && t.DataEntrega != null
                    && t.Status != StatusTarefa.Feito && t.Status != StatusTarefa.Cancelado
                    && t.LembreteNivel < 3)
                .ToListAsync();

            foreach (var tarefa in tarefas)
            {
                var nivel = ObterNivel(tarefa.DataEntrega!.Value, agora);
                if (nivel == 0 || tarefa.LembreteNivel >= nivel)
                    continue;

                var responsaveis = await _context.TarefaResponsaveis
                    .Where(tr => tr.TarefaId == tarefa.Id)
                    .Select(tr => tr.UsuarioId)
                    .ToListAsync();

                if (responsaveis.Count == 0)
                {
                    tarefa.LembreteNivel = nivel;
                    continue;
                }

                var link = tarefa.Chave != null ? $"/tarefas/{tarefa.Chave}" : null;
                var titulo = TituloLembrete(nivel, tarefa.Chave, tarefa.Titulo);
                var descricao = $"{tarefa.Titulo} • {tarefa.Projeto?.Nome} • entrega {tarefa.DataEntrega!.Value:dd/MM/yyyy HH:mm}";

                var dataEntrega = tarefa.DataEntrega!.Value.Kind == DateTimeKind.Utc
                    ? tarefa.DataEntrega.Value
                    : DateTime.SpecifyKind(tarefa.DataEntrega.Value, DateTimeKind.Utc);
                var descricaoLocal = $"{tarefa.Titulo} • {tarefa.Projeto?.Nome} • entrega {TimeZoneInfo.ConvertTimeFromUtc(dataEntrega, FusoSaoPaulo):dd/MM/yyyy HH:mm}";
                descricao = descricaoLocal;

                foreach (var usuarioId in responsaveis)
                {
                    await _notificacaoServico.CriarENotificarAsync(titulo, descricao, "prazo", link, usuarioId, tarefa.Id, tarefa.ProjetoId);
                }

                tarefa.LembreteNivel = nivel;
            }

            await _context.SaveChangesAsync();
        }

        private static int ObterNivel(DateTime dataEntrega, DateTime agora)
        {
            if (dataEntrega <= agora) return 3;
            if (dataEntrega <= agora.AddHours(1)) return 2;
            if (dataEntrega <= agora.AddDays(1)) return 1;
            return 0;
        }

        private static string TituloLembrete(int nivel, string? chave, string titulo)
        {
            var referencia = chave != null ? $"Tarefa {chave}" : $"Tarefa \"{titulo}\"";
            return nivel switch
            {
                3 => $"{referencia} está atrasada",
                2 => $"{referencia} vence em 1 hora",
                _ => $"{referencia} vence em 1 dia",
            };
        }
    }
}
