using TesisFlow.Core.Interfaces;
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

        public TarefaSalvar(ITarefaRepositorio repositorio, IProjetoRepositorio projetoRepositorio, ApplicationDbContextTesisFlow context)
        {
            _repositorio = repositorio;
            _projetoRepositorio = projetoRepositorio;
            _context = context;
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
                Tipo = dto.Tipo,
                Ordem = maiorOrdem + 1,
                ProjetoId = dto.ProjetoId,
                SprintId = dto.SprintId,
                CriadorId = dto.CriadorId
            };

            await _repositorio.AdicionarAsync(tarefa);
            await SalvarResponsaveisAsync(tarefa.Id, dto.ResponsavelIds);
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
                var ultimaChave = await _context.Tarefas
                    .Where(t => t.Chave != null && t.Chave.StartsWith(prefixo + "-"))
                    .OrderByDescending(t => t.Chave)
                    .Select(t => t.Chave)
                    .FirstOrDefaultAsync();

                int numero = 1;
                if (ultimaChave != null)
                {
                    var partes = ultimaChave.Split('-');
                    if (partes.Length == 2 && int.TryParse(partes[1], out var ultimoNumero))
                        numero = ultimoNumero + 1;
                }

                return $"{prefixo}-{numero}";
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

            var alteracoes = new List<(string campo, string? antigo, string? novo)>();

            if (tarefa.Titulo != dto.Titulo)
                alteracoes.Add(("Titulo", tarefa.Titulo, dto.Titulo));
            if (tarefa.Descricao != dto.Descricao)
                alteracoes.Add(("Descricao", tarefa.Descricao, dto.Descricao));
            if (tarefa.Status != dto.Status)
                alteracoes.Add(("Status", StatusLabel(tarefa.Status), StatusLabel(dto.Status)));
            if (tarefa.Prioridade != dto.Prioridade)
                alteracoes.Add(("Prioridade", PrioridadeLabel(tarefa.Prioridade), PrioridadeLabel(dto.Prioridade)));
            if (tarefa.Tipo != dto.Tipo)
                alteracoes.Add(("Tipo", TipoLabel(tarefa.Tipo), TipoLabel(dto.Tipo)));

            tarefa.Titulo = dto.Titulo;
            tarefa.Descricao = dto.Descricao;
            tarefa.Status = dto.Status;
            tarefa.Prioridade = dto.Prioridade;
            tarefa.Tipo = dto.Tipo;
            tarefa.ProjetoId = dto.ProjetoId;
            tarefa.SprintId = dto.SprintId;

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
                    UsuarioId = dto.CriadorId
                });
            }
            await _context.SaveChangesAsync();

            await SalvarResponsaveisAsync(id, dto.ResponsavelIds);
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

        private static string TipoLabel(Modelo.Enums.TipoTarefa t) => t switch
        {
            Modelo.Enums.TipoTarefa.Tarefa => "Tarefa",
            Modelo.Enums.TipoTarefa.Bug => "Bug",
            Modelo.Enums.TipoTarefa.Melhoria => "Melhoria",
            Modelo.Enums.TipoTarefa.Historia => "Historia",
            _ => t.ToString()
        };

        private async Task SalvarResponsaveisAsync(int tarefaId, List<int> responsavelIds)
        {
            var existentes = await _context.TarefaResponsaveis
                .Where(tr => tr.TarefaId == tarefaId)
                .ToListAsync();

            var paraRemover = existentes.Where(e => !responsavelIds.Contains(e.UsuarioId));
            var paraAdicionar = responsavelIds
                .Where(id => !existentes.Any(e => e.UsuarioId == id))
                .Select(id => new TarefaResponsavel { TarefaId = tarefaId, UsuarioId = id });

            _context.TarefaResponsaveis.RemoveRange(paraRemover);
            await _context.TarefaResponsaveis.AddRangeAsync(paraAdicionar);
            await _context.SaveChangesAsync();
        }

        public async Task MoverAsync(TarefaMoverDTO dto)
        {
            await _repositorio.MoverAsync(dto.Id, dto.Ordem, (int)dto.Status);
        }
    }
}
