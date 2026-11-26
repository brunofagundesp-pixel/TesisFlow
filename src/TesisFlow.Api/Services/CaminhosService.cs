namespace TesisFlow.Api.Services
{
    public class CaminhosService
    {
        private readonly string _uploadsBasePath;

        public CaminhosService(IConfiguration configuration)
        {
            var configurado = configuration["Paths:Uploads"];

            if (string.IsNullOrWhiteSpace(configurado))
            {
                var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                configurado = Path.Combine(localAppData, "TesisFlow", "uploads");
            }

            _uploadsBasePath = Environment.ExpandEnvironmentVariables(configurado);
        }

        public string UploadsBasePath => _uploadsBasePath;
    }
}
