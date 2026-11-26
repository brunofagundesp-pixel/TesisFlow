using Google.Apis.Auth.OAuth2;
using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Hosting;

namespace TesisFlow.Api.Services
{
    public class FirebaseStorageService
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _environment;
        private StorageClient? _client;
        private string? _bucket;

        public FirebaseStorageService(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _configuration = configuration;
            _environment = environment;
        }

        private string ObterBucket()
        {
            return _bucket ??= _configuration["Firebase:StorageBucket"]
                ?? Environment.GetEnvironmentVariable("FIREBASE_STORAGE_BUCKET")
                ?? throw new InvalidOperationException("Bucket do Firebase Storage nao configurado (Firebase:StorageBucket ou FIREBASE_STORAGE_BUCKET).");
        }

        private StorageClient ObterCliente()
        {
            if (_client != null) return _client;

            var json = _configuration["Firebase:CredentialsJson"]
                ?? Environment.GetEnvironmentVariable("FIREBASE_CREDENTIALS_JSON");

            if (!string.IsNullOrWhiteSpace(json))
            {
                _client = new StorageClientBuilder { Credential = GoogleCredential.FromJson(json) }.Build();
                return _client;
            }

            var caminho = _configuration["Firebase:CredentialsPath"]
                ?? Environment.GetEnvironmentVariable("FIREBASE_CREDENTIALS_PATH");

            if (!string.IsNullOrWhiteSpace(caminho))
            {
                if (!Path.IsPathRooted(caminho))
                    caminho = Path.Combine(_environment.ContentRootPath, caminho);

                _client = new StorageClientBuilder { Credential = GoogleCredential.FromFile(caminho) }.Build();
                return _client;
            }

            _client = StorageClient.Create();
            return _client;
        }

        public async Task<string> UploadAsync(string subpasta, Stream conteudo, string contentType, string extensao)
        {
            var nomeObjeto = $"{subpasta}/{Guid.NewGuid():N}{extensao}";
            var bucket = ObterBucket();
            await ObterCliente().UploadObjectAsync(bucket, nomeObjeto, contentType, conteudo);
            return $"https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{Uri.EscapeDataString(nomeObjeto)}?alt=media";
        }

        public async Task DeleteAsync(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return;

            var marcador = "/o/";
            var idx = url.IndexOf(marcador, StringComparison.Ordinal);
            if (idx < 0) return;

            var objetoCodificado = url.Substring(idx + marcador.Length);
            var qIdx = objetoCodificado.IndexOf('?');
            if (qIdx >= 0) objetoCodificado = objetoCodificado.Substring(0, qIdx);

            var nomeObjeto = Uri.UnescapeDataString(objetoCodificado);
            if (string.IsNullOrWhiteSpace(nomeObjeto)) return;

            try
            {
                await ObterCliente().DeleteObjectAsync(ObterBucket(), nomeObjeto);
            }
            catch
            {
                // ignora falha ao excluir objeto remoto
            }
        }
    }
}
