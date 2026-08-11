import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { Cliente, Atendimento, DiarioEntry, FinanceiroEntry } from './clientes-data';

// Token gerenciado pelo proxy (proxy.conf.mjs) durante desenvolvimento.
// Em producao, sera necessario um interceptor ou fluxo de login real.

interface ClienteOData {
  idColegio: number;
  idTesis: string;
  nome: string;
  situacao: string;
  bloqueado: string;
  apelido: string | null;
  contato: string;
  telefone: string;
  email: string | null;
  municipio: string;
  uf: string;
  idDiario: number | null;
  idPortalAluno: string | null;
  cnpj: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  fax: string;
}

interface AtendimentoApi {
  idContato: number;
  dataContato: string;
  nomeusuario: string;
  idUsuario: number | null;
  referencia: string;
  detalhes: string;
  nomeContato: string;
  idStatusContato: number;
  temAnexo: boolean;
  protocoloComentario: string;
}

interface ODataResponse<T> {
  '@odata.context': string;
  '@odata.count'?: number;
  value: T[];
}

export interface ClientePage {
  items: Cliente[];
  total: number;
}

function mapCliente(api: ClienteOData): Cliente {
  return {
    id: api.idColegio,
    nome: api.nome,
    apelido: api.apelido || '',
    status: api.situacao.toUpperCase().includes('ATIVO') ? 'Ativo' : 'Inativo',
    estado: api.uf,
    cidade: api.municipio,
    contato: api.contato || '',
    telefone: api.telefone || '',
    codigoDiario: api.idDiario?.toString() || '',
    senhaMasterDiario: '',
    codigoPortalAluno: api.idPortalAluno || '',
    codigoAplicativo: '',
    apelidoAplicativo: '',
    email: api.email || '',
    linkTGE: '',
    cnpj: api.cnpj,
    endereco: api.endereco,
    bairro: api.bairro,
    cep: api.cep,
    idTesis: api.idTesis,
    idDiarioRaw: api.idDiario,
  };
}

function mapAtendimento(api: AtendimentoApi): Atendimento {
  return {
    id: api.idContato,
    titulo: api.referencia || '',
    descricao: api.detalhes || '',
    protocolo: api.protocoloComentario || '',
    usuario: api.nomeusuario || '',
    data: api.dataContato ? api.dataContato.split('T')[0] : '',
    idStatusContato: api.idStatusContato ?? 0,
    nomeContato: api.nomeContato || '',
  };
}

@Injectable({ providedIn: 'root' })
export class ClienteApiService {
  private http = inject(HttpClient);
  private baseUrl = '/odata/cc_cliente';

  listarAtivos(): Observable<Cliente[]> {
    const filter = encodeURIComponent("situacao eq 'CLIENTE ATIVO'");
    const url = `${this.baseUrl}?$filter=${filter}`;

    return this.http.get<ODataResponse<ClienteOData>>(url).pipe(
      map(res => res.value.map(mapCliente)),
    );
  }

  listarAtivosPaginado(top: number, skip: number): Observable<ClientePage> {
    const filter = encodeURIComponent("situacao eq 'CLIENTE ATIVO'");
    const url = `${this.baseUrl}?$filter=${filter}&$top=${top}&$skip=${skip}&$count=true`;

    return this.http.get<ODataResponse<ClienteOData>>(url).pipe(
      map(res => ({
        items: res.value.map(mapCliente),
        total: res['@odata.count'] ?? 0,
      })),
    );
  }

  obterPorId(id: number): Observable<Cliente | undefined> {
    const url = `/api/tesiscc/GetClienteIdColegio/${id}`;

    return this.http.get<ClienteOData>(url).pipe(
      map(api => mapCliente(api)),
    );
  }

  getAtendimentos(idCliente: number): Observable<Atendimento[]> {
    const url = `/api/tesiscc/GetContatosIdCliente/${idCliente}`;

    return this.http.get<AtendimentoApi[]>(url).pipe(
      map(res => (res || []).map(mapAtendimento)),
    );
  }

  getSenhaDiario(idDiario: number | string): Observable<string> {
    return this.http.get(`/api/Diario/SenhaMasterDiario/${idDiario}`, { responseType: 'text' }).pipe(
      map(senha => senha?.trim() || ''),
    );
  }

  getCodigosApp(idTesis: string): Observable<{ codigoAplicativo: string; apelidoAplicativo: string }> {
    return this.http.get<{ codigoAplicativo: string; apelidoAplicativo: string }>(
      `/api/TesisTW/GetCodigosApp/${idTesis}`,
    );
  }

  getProfessores(idDiario: number | string, ano: number): Observable<DiarioEntry[]> {
    return this.http.get<ProfessorApi[]>(`/api/Diario/GetProfessoresAno/${idDiario}/${ano}`).pipe(
      map(res => (res || []).map(p => ({
        id: p.idProfessor,
        professorId: p.idProfessor,
        nome: p.nome,
        telefone: p.telefone,
        celular: p.celular,
        email: p.email,
        ativo: p.ativo,
        senha: p.senha,
      }))),
    );
  }

  getParcelas(idColegio: number): Observable<FinanceiroEntry[]> {
    const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return this.http.get<ParcelaApi[]>(`/api/TesisCc/GetParcelasClientes/${idColegio}`).pipe(
      map(parcelas => (parcelas || []).map((p, i) => {
        const venc = new Date(p.vencimento);
        const status = p.dataPagamento ? 'Pago' : new Date(p.vencimento) < new Date() ? 'Atrasado' : 'Pendente';
        return {
          id: i,
          descricao: p.descricaoParcela,
          vencimento: p.vencimento.split('T')[0],
          mes: meses[venc.getMonth()],
          ano: venc.getFullYear(),
          valorReal: p.valorReal,
          valorAtual: p.valorAtual,
          valorPago: p.valorPago,
          dataPagamento: p.dataPagamento ? p.dataPagamento.split('T')[0] : null,
          statusParcela: status,
          urlBoleto: p.urlBoleto || '',
        };
      })),
    );
  }
}

interface ParcelaApi {
  idExtrato: number | null;
  descricaoParcela: string;
  vencimento: string;
  valorReal: number;
  juros: number;
  multa: number;
  valorAtual: number;
  dataPagamento: string | null;
  valorPago: number;
  urlBoleto: string;
}

interface ProfessorApi {
  idColegio: number;
  idProfessor: string;
  nome: string;
  telefone: string;
  celular: string;
  email: string;
  ativo: string;
  senha: string;
}
