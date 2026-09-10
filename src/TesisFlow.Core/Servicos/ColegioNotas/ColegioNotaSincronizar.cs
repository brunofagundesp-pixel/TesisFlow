using System.Text.Json;
using Microsoft.Extensions.Logging;
using TesisFlow.Core.Interfaces;
using TesisFlow.Core.Servicos.Integracoes;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.ColegioNotas
{
    public class ColegioNotaSincronizar
    {
        private readonly IColegioNotaRepositorio _repositorio;
        private readonly TesisCcService _tesisCcService;
        private readonly ILogger<ColegioNotaSincronizar> _logger;

        public ColegioNotaSincronizar(IColegioNotaRepositorio repositorio, TesisCcService tesisCcService, ILogger<ColegioNotaSincronizar> logger)
        {
            _repositorio = repositorio;
            _tesisCcService = tesisCcService;
            _logger = logger;
        }

        public async Task<List<ColegioNotaDTO>> SincronizarParceirosAsync(int colegioId)
        {
            var raw = await _tesisCcService.GetRawAsync($"api/TesisCc/ListarParceirosCliente/{colegioId}");
            if (string.IsNullOrWhiteSpace(raw))
                return new List<ColegioNotaDTO>();

            List<ParceiroDTO> parceiros;
            try
            {
                parceiros = JsonSerializer.Deserialize<List<ParceiroDTO>>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? new List<ParceiroDTO>();
            }
            catch (JsonException)
            {
                return new List<ColegioNotaDTO>();
            }

            if (parceiros.Count == 0)
                return new List<ColegioNotaDTO>();

            var existentes = await _repositorio.ObterParceiroIdsAsync(colegioId);
            var criadas = new List<ColegioNotaDTO>();

            foreach (var parceiro in parceiros)
            {
                if (parceiro.IdParceiro == 0 || existentes.Contains(parceiro.IdParceiro))
                    continue;

                var linhas = new[] { parceiro.Telefone1, parceiro.Telefone2, parceiro.Telefone3 }
                    .Where(t => !string.IsNullOrWhiteSpace(t));

                var nota = new ColegioNota
                {
                    ColegioId = colegioId,
                    Titulo = parceiro.Nome ?? string.Empty,
                    Conteudo = string.Join("\n", linhas),
                    Cor = string.Empty,
                    Fixa = false,
                    ParceiroId = parceiro.IdParceiro,
                };

                try
                {
                    var salva = await _repositorio.AdicionarAsync(nota);
                    criadas.Add(ColegioNotaConsultar.Mapear(salva));
                }
                catch (Exception ex)
                {
                    var mensagem = new System.Text.StringBuilder();
                    var detalhe = ex;
                    while (detalhe != null)
                    {
                        mensagem.AppendLine(detalhe.Message);
                        detalhe = detalhe.InnerException;
                    }

                    _logger.LogError("Falha ao criar nota de parceiro {ParceiroId} no colegio {ColegioId}: {Erro}", parceiro.IdParceiro, colegioId, mensagem.ToString());
                    throw;
                }
            }

            return criadas;
        }
    }
}
