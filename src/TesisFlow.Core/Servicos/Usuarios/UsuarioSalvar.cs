using TesisFlow.Core.Interfaces;
using TesisFlow.Modelo.Entidades;

namespace TesisFlow.Core.Servicos.Usuarios
{
    public class UsuarioSalvar
    {
        private readonly IUsuarioRepositorio _repositorio;

        public UsuarioSalvar(IUsuarioRepositorio repositorio)
        {
            _repositorio = repositorio;
        }

        public async Task<Usuario> CriarAsync(string nome, string email, string senha, string? cargo = null)
        {
            if (await _repositorio.EmailExisteAsync(email))
                throw new InvalidOperationException("Email já cadastrado.");

            var usuario = new Usuario
            {
                Nome = nome,
                Email = email,
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
                Cargo = cargo
            };

            return await _repositorio.AdicionarAsync(usuario);
        }

        public async Task<Usuario> AtualizarAsync(int id, string nome, string? cargo, string? foto)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");

            usuario.Nome = nome;
            usuario.Cargo = cargo;
            if (foto != null) usuario.Foto = foto;

            return await _repositorio.AtualizarAsync(usuario);
        }

        public async Task<Usuario> DefinirTesisCcSidAsync(int id, string? tesisCcSid)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");

            usuario.TesisCcSid = string.IsNullOrWhiteSpace(tesisCcSid) ? null : tesisCcSid.Trim();

            return await _repositorio.AtualizarAsync(usuario);
        }

        public async Task<Usuario> DefinirCargoAsync(int id, string? cargo)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");

            usuario.Cargo = string.IsNullOrWhiteSpace(cargo) ? null : cargo.Trim();

            return await _repositorio.AtualizarAsync(usuario);
        }

        public async Task<Usuario> DefinirFotoAsync(int id, string? foto)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");

            usuario.Foto = foto;

            return await _repositorio.AtualizarAsync(usuario);
        }

        public async Task<Usuario> DefinirBannerAsync(int id, string? banner)
        {
            var usuario = await _repositorio.ObterPorIdAsync(id)
                ?? throw new KeyNotFoundException("Usuário não encontrado.");

            usuario.Banner = banner;

            return await _repositorio.AtualizarAsync(usuario);
        }
    }
}
