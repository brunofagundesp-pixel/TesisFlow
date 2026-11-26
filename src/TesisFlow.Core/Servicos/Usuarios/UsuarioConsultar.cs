using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.DTOs;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Usuarios
{
    public class UsuarioConsultar
    {
        private readonly IUsuarioRepositorio _repositorio;

        public UsuarioConsultar(IUsuarioRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<IEnumerable<UsuarioDTO>> ObterTodosAsync()
        {
            var usuarios = await _repositorio.ObterTodosAsync();
            return usuarios.Select(MapToDTO);
        }

        public async Task<UsuarioDTO?> ObterPorIdAsync(int id)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id);
            return usuario != null ? MapToDTO(usuario) : null;
        }

        public async Task<IEnumerable<UsuarioAdminDTO>> ObterAdminAsync()
        {
            var usuarios = await _repositorio.ObterTodosAsync();
            return usuarios
                .OrderBy(u => u.Nome)
                .Select(u => new UsuarioAdminDTO
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    Email = u.Email,
                    Cargo = u.Cargo,
                    TesisCcSid = u.TesisCcSid,
                    Ativo = u.Ativo
                });
        }

        public async Task<UsuarioDTO?> ObterPorEmailAsync(string email)
        {
            var usuario = await _repositorio.ObterPorEmailAsync(email);
            return usuario != null ? MapToDTO(usuario) : null;
        }

        public async Task<Usuario?> ObterEntidadePorEmailAsync(string email)
        {
            return await _repositorio.ObterPorEmailAsync(email);
        }

        public async Task<Usuario?> ObterEntidadePorIdAsync(int id)
        {
            return await _repositorio.ObterPorIdAsync(id);
        }

        private static UsuarioDTO MapToDTO(Usuario u) => new()
        {
            Id = u.Id,
            Nome = u.Nome,
            Email = u.Email,
            Foto = u.Foto,
            Banner = u.Banner,
            Cargo = u.Cargo,
            Ativo = u.Ativo
        };
    }
}
