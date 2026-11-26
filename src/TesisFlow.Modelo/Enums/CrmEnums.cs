namespace TesisFlow.Modelo.Enums
{
    public enum TipoInteracao
    {
        PrimeiroContato = 0,
        Retorno = 1,
        Ligacao = 2,
        Apresentacao = 3,
        EnvioProposta = 4,
        Negociacao = 5,
        Outro = 6
    }

    public enum CanalContato
    {
        WhatsApp = 0,
        Telefone = 1,
        Email = 2,
        Presencial = 3,
        Outro = 4
    }

    public enum ResultadoContato
    {
        SemResposta = 0,
        Interesse = 1,
        SolicitouRetorno = 2,
        ReuniaoAgendada = 3,
        SemInteresse = 4,
        Outro = 5
    }

    public enum EtapaComercial
    {
        NaoContatada = 0,
        PrimeiroContato = 1,
        EmAcompanhamento = 2,
        Interessada = 3,
        EmNegociacao = 4,
        ClienteConquistado = 5,
        NaoInteressado = 6,
        OportunidadePerdida = 7
    }
}
