using Microsoft.EntityFrameworkCore;
using TesisFlow.Contexto.Contextos;
using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Categorias
{
    public class CategoriaConsultar
    {
        private readonly ICategoriaRepositorio _repositorio;
        private readonly ApplicationDbContextTesisFlow _context;

        public CategoriaConsultar(ICategoriaRepositorio repositorio, ApplicationDbContextTesisFlow context)
        {
            _repositorio = repositorio;
            _context = context;
        }

        public async Task<IEnumerable<CategoriaDTO>> ObterPorProjetoAsync(int projetoId)
        {
            var categorias = await _repositorio.ObterPorProjetoAsync(projetoId);
            var contagens = await ObterContagensAsync(projetoId);
            return categorias.Select(c => MapToDTO(c, contagens.GetValueOrDefault(c.Id, 0)));
        }

        private async Task<Dictionary<int, int>> ObterContagensAsync(int projetoId)
        {
            return await _context.Tarefas
                .Where(t => t.Ativo && t.ProjetoId == projetoId)
                .GroupBy(t => t.CategoriaId)
                .Select(g => new { CategoriaId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoriaId, x => x.Count);
        }

        private static CategoriaDTO MapToDTO(Categoria c, int quantidade) => new()
        {
            Id = c.Id,
            ProjetoId = c.ProjetoId,
            Nome = c.Nome,
            Icone = c.Icone,
            Cor = c.Cor,
            QuantidadeTarefas = quantidade,
            Ativo = c.Ativo
        };
    }
}
