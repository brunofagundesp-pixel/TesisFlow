using TesisFlow.Core.Interfaces;
using TesisFlow.Core.Servicos.Integracoes;
using TesisFlow.Core.Servicos.Notificacoes;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;
using Microsoft.EntityFrameworkCore;

namespace TesisFlow.Core.Servicos.Tarefas
{
    public class TarefaSalvar
    {
        private readonly ITarefaRepositorio _repositorio;
        private readonly IProjetoRepositorio _projetoRepositorio;
        private readonly ApplicationDbContextTesisFlow _context;
        private readonly TesisCcService _tesisCcService;
        private readonly NotificacaoServico _notificacaoServico;

        public TarefaSalvar(ITarefaRepositorio repositorio, IProjetoRepositorio projetoRepositorio, ApplicationDbContextTesisFlow context, TesisCcService tesisCcService, NotificacaoServico notificacaoServico)
        {
            _repositorio = repositorio;
            _projetoRepositorio = projetoRepositorio;
            _context = context;
            _tesisCcService = tesisCcService;
            _notificacaoServico = notificacaoServico;
        }

        public async Task<Tarefa> CriarAsync(TarefaSalvarDTO dto)
        {
            var projeto = await _projetoRepositorio.ObterPorIdAsync(dto.ProjetoId)
                ?? throw new KeyNotFoundException("Projeto não encontrado.");

            var maiorOrdem = await _repositorio.ObterMaiorOrdemAsync(dto.ProjetoId, dto.Status);

            var chave = await GerarChaveSeguraAsync(projeto);

            var tarefa = new Tarefa
            {
                Titulo = dto.Titulo,
                Chave = chave,
                Descricao = dto.Descricao,
                Status = dto.Status,
                Prioridade = dto.Prioridade,
                CategoriaId = dto.Tipo,
                Ordem = maiorOrdem + 1,
                ProjetoId = dto.ProjetoId,
                SprintId = dto.SprintId,
                CriadorId = dto.CriadorId,
                ColegioId = dto.ColegioId,
                ColegioNome = dto.ColegioNome,
                ContatoNome = dto.ContatoNome,
                DataEntrega = dto.DataEntrega
            };

            await _repositorio.AdicionarAsync(tarefa);
            await SalvarResponsaveisAsync(tarefa.Id, dto.ResponsavelIds, dto.CriadorId, registrarHistorico: false);
            await SincronizarContatoAsync(tarefa);
            return tarefa;
        }

        private static string GerarPrefixo(string nomeProjeto)
        {
            var palavras = nomeProjeto.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var iniciais = new string(palavras.Select(p => char.ToUpperInvariant(p[0])).ToArray());

            if (iniciais.Length >= 2)
                return iniciais.Length <= 4 ? iniciais : iniciais.Substring(0, 4);

            var letras = new string(nomeProjeto
                .Where(char.IsLetter)
                .Take(3)
                .ToArray())
                .ToUpperInvariant();

            return letras.Length >= 2 ? letras : letras.PadRight(2, 'X');
        }

        private async Task<string?> GerarChaveSeguraAsync(Projeto projeto)
        {
            try
            {
                var prefixo = GerarPrefixo(projeto.Nome);
                var chaves = await _context.Tarefas
                    .Where(t => t.Chave != null && t.Chave.StartsWith(prefixo + "-"))
                    .Select(t => t.Chave)
                    .ToListAsync();

                var maior = 0;
                foreach (var chave in chaves)
                {
                    if (chave == null) continue;
                    var partes = chave.Split('-');
                    if (partes.Length == 2 && int.TryParse(partes[1], out var numero) && numero > maior)
                        maior = numero;
                }

                return $"{prefixo}-{maior + 1}";
            }
            catch
            {
                return null;
            }
        }

        public async Task<Tarefa> AtualizarAsync(int id, TarefaSalvarDTO dto)
        {
            var tarefa = await _context.Tarefas.FindAsync(id)
                ?? throw new KeyNotFoundException("Tarefa não encontrada.");

            var colegioIdAnterior = tarefa.ColegioId;

            var alteracoes = new List<(string campo, string? antigo, string? novo)>();

            if (tarefa.Titulo != dto.Titulo)
                alteracoes.Add(("Titulo", tarefa.Titulo, dto.Titulo));
            if (tarefa.Descricao != dto.Descricao)
                alteracoes.Add(("Descricao", tarefa.Descricao, dto.Descricao));
            if (tarefa.Status != dto.Status)
                alteracoes.Add(("Status", StatusLabel(tarefa.Status), StatusLabel(dto.Status)));
            if (tarefa.Prioridade != dto.Prioridade)
                alteracoes.Add(("Prioridade", PrioridadeLabel(tarefa.Prioridade), PrioridadeLabel(dto.Prioridade)));
            if (tarefa.CategoriaId != dto.Tipo)
            {
                var categoriaAntiga = await _context.Categorias.FindAsync(tarefa.CategoriaId);
                var categoriaNova = await _context.Categorias.FindAsync(dto.Tipo);
                alteracoes.Add(("Tipo de tarefa", categoriaAntiga?.Nome, categoriaNova?.Nome));
            }
            if (tarefa.ColegioId != dto.ColegioId || tarefa.ColegioNome != dto.ColegioNome)
                alteracoes.Add(("Colégio", tarefa.ColegioNome, dto.ColegioNome));
            if (tarefa.ContatoNome != dto.ContatoNome)
                alteracoes.Add(("Contato", tarefa.ContatoNome, dto.ContatoNome));
            if (tarefa.DataEntrega != dto.DataEntrega)
                alteracoes.Add(("Prazo de entrega", FormatarData(tarefa.DataEntrega), FormatarData(dto.DataEntrega)));

            var dataEntregaAlterada = tarefa.DataEntrega != dto.DataEntrega;

            var precisaSincronizar = alteracoes.Any(a => a.campo is "Titulo" or "Descricao" or "Status" or "Colégio" or "Contato")
                || (dto.ColegioId != null && tarefa.ContatoId == null);

            var atorId = dto.AtorId ?? dto.CriadorId;

            tarefa.Titulo = dto.Titulo;
            tarefa.Descricao = dto.Descricao;
            tarefa.Status = dto.Status;
            tarefa.Prioridade = dto.Prioridade;
            tarefa.CategoriaId = dto.Tipo;
            tarefa.ProjetoId = dto.ProjetoId;
            tarefa.SprintId = dto.SprintId;
            tarefa.ColegioId = dto.ColegioId;
            tarefa.ColegioNome = dto.ColegioNome;
            tarefa.ContatoNome = dto.ContatoNome;
            tarefa.DataEntrega = dto.DataEntrega;
            if (dataEntregaAlterada)
                tarefa.LembreteNivel = 0;

            if (dto.Status == Modelo.Enums.StatusTarefa.Feito && tarefa.DataConclusao == null)
                tarefa.DataConclusao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            foreach (var (campo, antigo, novo) in alteracoes)
            {
                _context.HistoricoTarefas.Add(new Modelo.Entidades.HistoricoTarefa
                {
                    TarefaId = id,
                    Campo = campo,
                    ValorAntigo = antigo,
                    ValorNovo = novo,
                    UsuarioId = atorId
                });
            }
            await _context.SaveChangesAsync();

            await SalvarResponsaveisAsync(id, dto.ResponsavelIds, atorId, registrarHistorico: true);

            if (alteracoes.Any(a => a.campo == "Status"))
            {
                await NotificarMovimentacaoAsync(id, dto.Status, atorId);
            }

            if (dto.ColegioId != null)
            {
                if (precisaSincronizar)
                    await SincronizarContatoAsync(tarefa);
            }
            else if (colegioIdAnterior != null)
            {
                await _tesisCcService.ExcluirContatoAsync(tarefa.ContatoId, colegioIdAnterior, tarefa.Chave);
                tarefa.ContatoId = null;
                await _context.SaveChangesAsync();
            }

            return tarefa;
        }

        private static string StatusLabel(Modelo.Enums.StatusTarefa s) => s switch
        {
            Modelo.Enums.StatusTarefa.Backlog => "Backlog",
            Modelo.Enums.StatusTarefa.Fazer => "A Fazer",
            Modelo.Enums.StatusTarefa.Andamento => "Em Andamento",
            Modelo.Enums.StatusTarefa.Revisao => "Revisao",
            Modelo.Enums.StatusTarefa.Feito => "Concluido",
            Modelo.Enums.StatusTarefa.Cancelado => "Cancelado",
            _ => s.ToString()
        };

        private static string PrioridadeLabel(Modelo.Enums.PrioridadeTarefa p) => p switch
        {
            Modelo.Enums.PrioridadeTarefa.Baixa => "Baixa",
            Modelo.Enums.PrioridadeTarefa.Media => "Media",
            Modelo.Enums.PrioridadeTarefa.Alta => "Alta",
            Modelo.Enums.PrioridadeTarefa.Critica => "Critica",
            _ => p.ToString()
        };

        private static string? FormatarData(DateTime? d) => d?.ToString("dd/MM/yyyy HH:mm");

        private async Task SalvarResponsaveisAsync(int tarefaId, List<int> responsavelIds, int usuarioId, bool registrarHistorico)
        {
            var existentes = await _context.TarefaResponsaveis
                .Where(tr => tr.TarefaId == tarefaId)
                .ToListAsync();

            var removidos = existentes.Where(e => !responsavelIds.Contains(e.UsuarioId)).ToList();
            var adicionados = responsavelIds
                .Where(id => !existentes.Any(e => e.UsuarioId == id))
                .ToList();

            _context.TarefaResponsaveis.RemoveRange(removidos);
            await _context.TarefaResponsaveis.AddRangeAsync(adicionados.Select(id => new TarefaResponsavel { TarefaId = tarefaId, UsuarioId = id }));
            await _context.SaveChangesAsync();

            if (registrarHistorico && (removidos.Count > 0 || adicionados.Count > 0))
            {
                var ids = removidos.Select(r => r.UsuarioId).Concat(adicionados).Distinct().ToList();
                var nomes = new Dictionary<int, string>();
                foreach (var id in ids)
                {
                    var nome = await _context.Usuarios
                        .AsNoTracking()
                        .Where(u => u.Id == id)
                        .Select(u => u.Nome)
                        .FirstOrDefaultAsync();
                    if (nome != null)
                        nomes[id] = nome;
                }

                string Nome(int id) => nomes.TryGetValue(id, out var n) ? n : "Usuário";

                foreach (var r in removidos)
                {
                    _context.HistoricoTarefas.Add(new HistoricoTarefa
                    {
                        TarefaId = tarefaId,
                        Campo = "Responsáveis",
                        ValorAntigo = Nome(r.UsuarioId),
                        ValorNovo = null,
                        UsuarioId = usuarioId
                    });
                }

                foreach (var id in adicionados)
                {
                    _context.HistoricoTarefas.Add(new HistoricoTarefa
                    {
                        TarefaId = tarefaId,
                        Campo = "Responsáveis",
                        ValorAntigo = null,
                        ValorNovo = Nome(id),
                        UsuarioId = usuarioId
                    });
                }

                await _context.SaveChangesAsync();
            }

            await NotificarAtribuicaoAsync(tarefaId, adicionados.Where(id => id != usuarioId), usuarioId);
        }

        private async Task NotificarAtribuicaoAsync(int tarefaId, IEnumerable<int> usuarioIds, int atorId)
        {
            var ids = usuarioIds.Distinct().ToList();
            if (ids.Count == 0) return;

            var tarefa = await _context.Tarefas
                .AsNoTracking()
                .Where(t => t.Id == tarefaId)
                .Select(t => new { t.Chave, t.Titulo, t.ProjetoId, ProjetoNome = t.Projeto.Nome })
                .FirstOrDefaultAsync();
            if (tarefa == null) return;

            var atorNome = await _context.Usuarios
                .AsNoTracking()
                .Where(u => u.Id == atorId)
                .Select(u => u.Nome)
                .FirstOrDefaultAsync();

            var link = tarefa.Chave != null ? $"/tarefas/{tarefa.Chave}" : null;
            var titulo = tarefa.Chave != null
                ? $"Você foi atribuído à tarefa {tarefa.Chave}"
                : $"Você foi atribuído à tarefa \"{tarefa.Titulo}\"";
            var descricao = atorNome != null
                ? $"{tarefa.Titulo} • {tarefa.ProjetoNome} • atribuída por {atorNome}"
                : $"{tarefa.Titulo} • {tarefa.ProjetoNome}";

            foreach (var usuarioId in ids)
            {
                await _notificacaoServico.CriarENotificarAsync(
                    titulo,
                    descricao,
                    "atribuicao",
                    link,
                    usuarioId,
                    tarefaId,
                    tarefa.ProjetoId);
            }
        }

        private async Task NotificarMovimentacaoAsync(int tarefaId, Modelo.Enums.StatusTarefa novoStatus, int? atorId)
        {
            var tarefa = await _context.Tarefas
                .AsNoTracking()
                .Include(t => t.TarefaResponsaveis)
                .Include(t => t.Projeto)
                .FirstOrDefaultAsync(t => t.Id == tarefaId);
            if (tarefa == null) return;

            var responsaveis = tarefa.TarefaResponsaveis
                .Select(tr => tr.UsuarioId)
                .Where(id => id != atorId)
                .Distinct()
                .ToList();

            if (responsaveis.Count == 0) return;

            var link = tarefa.Chave != null ? $"/tarefas/{tarefa.Chave}" : null;
            var titulo = tarefa.Chave != null
                ? $"Tarefa {tarefa.Chave} movida para {StatusLabel(novoStatus)}"
                : $"Tarefa \"{tarefa.Titulo}\" movida para {StatusLabel(novoStatus)}";

            foreach (var usuarioId in responsaveis)
            {
                await _notificacaoServico.CriarENotificarAsync(
                    titulo,
                    $"{tarefa.Titulo} • {tarefa.Projeto.Nome}",
                    "tarefa",
                    link,
                    usuarioId,
                    tarefa.Id,
                    tarefa.ProjetoId);
            }
        }

        private async Task SincronizarContatoAsync(Tarefa tarefa)
        {
            if (tarefa.ColegioId == null) return;

            var contato = new TesisCcContatoDTO
            {
                IdContato = tarefa.ContatoId,
                IdColegio = tarefa.ColegioId.Value,
                DataContato = tarefa.DataCriacao.ToLocalTime().ToString("dd/MM/yyyy HH:mm:ss"),
                IdStatusContato = 0,
                Referencia = tarefa.Titulo,
                NomeContato = tarefa.ContatoNome,
                Detalhes = tarefa.Descricao,
                ProtocoloComentario = tarefa.Chave,
            };

            var sid = await _context.Usuarios
                .AsNoTracking()
                .Where(u => u.Id == tarefa.CriadorId)
                .Select(u => u.TesisCcSid)
                .FirstOrDefaultAsync();

            var contatoId = await _tesisCcService.SalvarContatoAsync(contato, sid);
            if (contatoId != null && tarefa.ContatoId != contatoId)
            {
                tarefa.ContatoId = contatoId;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Tarefa> RestaurarAsync(int id)
        {
            var tarefa = await _context.Tarefas.FindAsync(id)
                ?? throw new KeyNotFoundException("Tarefa não encontrada.");

            tarefa.Ativo = true;
            tarefa.DataExclusao = null;
            tarefa.ContatoId = null;
            await _context.SaveChangesAsync();

            await SincronizarContatoAsync(tarefa);
            return tarefa;
        }

        public async Task MoverAsync(TarefaMoverDTO dto)
        {
            var tarefa = await _context.Tarefas.FindAsync(dto.Id);
            if (tarefa == null) return;

            var statusAnterior = tarefa.Status;
            await _repositorio.MoverAsync(dto.Id, dto.Ordem, (int)dto.Status);

            if (statusAnterior != dto.Status)
            {
                _context.HistoricoTarefas.Add(new HistoricoTarefa
                {
                    TarefaId = dto.Id,
                    Campo = "Status",
                    ValorAntigo = StatusLabel(statusAnterior),
                    ValorNovo = StatusLabel(dto.Status),
                    UsuarioId = dto.UsuarioId ?? tarefa.CriadorId
                });
                await _context.SaveChangesAsync();

                await NotificarMovimentacaoAsync(dto.Id, dto.Status, dto.UsuarioId);
            }
        }

        public async Task ReordenarAsync(List<TarefaMoverDTO> itens)
        {
            var historicos = new List<HistoricoTarefa>();
            var movimentacoes = new List<TarefaMoverDTO>();

            foreach (var item in itens)
            {
                var tarefa = await _context.Tarefas.FindAsync(item.Id);
                if (tarefa == null) continue;

                var statusAnterior = tarefa.Status;
                tarefa.Ordem = item.Ordem;
                tarefa.Status = item.Status;
                if (item.Status == Modelo.Enums.StatusTarefa.Feito && tarefa.DataConclusao == null)
                    tarefa.DataConclusao = DateTime.UtcNow;

                if (statusAnterior != item.Status)
                {
                    historicos.Add(new HistoricoTarefa
                    {
                        TarefaId = item.Id,
                        Campo = "Status",
                        ValorAntigo = StatusLabel(statusAnterior),
                        ValorNovo = StatusLabel(item.Status),
                        UsuarioId = item.UsuarioId ?? tarefa.CriadorId
                    });

                    movimentacoes.Add(item);
                }
            }

            await _context.SaveChangesAsync();

            if (historicos.Count > 0)
            {
                _context.HistoricoTarefas.AddRange(historicos);
                await _context.SaveChangesAsync();
            }

            foreach (var item in movimentacoes)
            {
                await NotificarMovimentacaoAsync(item.Id, item.Status, item.UsuarioId);
            }
        }

        public async Task AlterarStatusEmMassaAsync(List<int> ids, Modelo.Enums.StatusTarefa status, int usuarioId)
        {
            var tarefas = new List<Tarefa>();
            foreach (var id in ids)
            {
                var tarefa = await _context.Tarefas.FindAsync(id);
                if (tarefa != null) tarefas.Add(tarefa);
            }

            var historicos = new List<HistoricoTarefa>();
            var movimentacoes = new List<Tarefa>();

            foreach (var tarefa in tarefas)
            {
                if (tarefa.Status == status) continue;

                historicos.Add(new HistoricoTarefa
                {
                    TarefaId = tarefa.Id,
                    Campo = "Status",
                    ValorAntigo = StatusLabel(tarefa.Status),
                    ValorNovo = StatusLabel(status),
                    UsuarioId = usuarioId
                });

                tarefa.Status = status;
                if (status == Modelo.Enums.StatusTarefa.Feito && tarefa.DataConclusao == null)
                    tarefa.DataConclusao = DateTime.UtcNow;

                movimentacoes.Add(tarefa);
            }

            if (tarefas.Count > 0) await _context.SaveChangesAsync();

            if (historicos.Count > 0)
            {
                _context.HistoricoTarefas.AddRange(historicos);
                await _context.SaveChangesAsync();
            }

            foreach (var tarefa in movimentacoes)
            {
                await NotificarMovimentacaoAsync(tarefa.Id, status, usuarioId);
            }
        }

        public async Task AlterarPrioridadeEmMassaAsync(List<int> ids, Modelo.Enums.PrioridadeTarefa prioridade, int usuarioId)
        {
            var tarefas = new List<Tarefa>();
            foreach (var id in ids)
            {
                var tarefa = await _context.Tarefas.FindAsync(id);
                if (tarefa != null) tarefas.Add(tarefa);
            }

            var historicos = new List<HistoricoTarefa>();

            foreach (var tarefa in tarefas)
            {
                if (tarefa.Prioridade == prioridade) continue;

                historicos.Add(new HistoricoTarefa
                {
                    TarefaId = tarefa.Id,
                    Campo = "Prioridade",
                    ValorAntigo = PrioridadeLabel(tarefa.Prioridade),
                    ValorNovo = PrioridadeLabel(prioridade),
                    UsuarioId = usuarioId
                });

                tarefa.Prioridade = prioridade;
            }

            if (tarefas.Count > 0) await _context.SaveChangesAsync();

            if (historicos.Count > 0)
            {
                _context.HistoricoTarefas.AddRange(historicos);
                await _context.SaveChangesAsync();
            }
        }
    }
}
