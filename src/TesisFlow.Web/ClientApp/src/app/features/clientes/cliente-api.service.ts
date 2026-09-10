import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Cliente, Atendimento, DiarioEntry, FinanceiroEntry, PortalAlunoEntry } from './clientes-data';

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

export interface ClientePage {
  items: Cliente[];
  total: number;
}

export interface ColegioNota {
  id: number;
  colegioId: number;
  titulo: string;
  conteudo: string;
  cor: string;
  fixa: boolean;
  parceiroId?: number | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
  dataFixacao?: string | null;
}

export interface ColegioNotaPage {
  itens: ColegioNota[];
  total: number;
}

export interface ColegioNotaPayload {
  colegioId?: number;
  titulo: string;
  conteudo: string;
  cor: string;
  fixa: boolean;
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

  listarAtivos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>('/api/Colegios');
  }

  listarAtivosPaginado(top: number, skip: number): Observable<ClientePage> {
    return this.http.get<{ itens: Cliente[]; total: number }>(`/api/Colegios?top=${top}&skip=${skip}`).pipe(
      map(res => ({ items: res.itens, total: res.total })),
    );
  }

  obterPorId(id: number): Observable<Cliente | undefined> {
    const url = `/api/integracao/cliente/${id}`;

    return this.http.get<ClienteOData>(url).pipe(
      map(api => mapCliente(api)),
    );
  }

  getAtendimentos(idCliente: number): Observable<Atendimento[]> {
    const url = `/api/integracao/contatos/${idCliente}`;

    return this.http.get<AtendimentoApi[]>(url).pipe(
      map(res => (res || []).map(mapAtendimento)),
    );
  }

  salvarContato(payload: {
    idContato?: number;
    idColegio: number;
    dataContato: string;
    idStatusContato: number;
    referencia: string;
    nomeContato?: string | null;
    detalhes?: string | null;
    protocoloComentario?: string | null;
  }): Observable<{ idContato?: number }> {
    return this.http.post<{ idContato?: number }>('/api/Atendimentos/salvar', payload);
  }

  getSenhaDiario(idDiario: number | string): Observable<string> {
    return this.http.get(`/api/integracao/diario/senha/${idDiario}`, { responseType: 'text' }).pipe(
      map(senha => senha?.trim() || ''),
    );
  }

  getCodigosApp(idTesis: string): Observable<{ codigoAplicativo: string; apelidoAplicativo: string }> {
    return this.http.get<{ codigoAplicativo: string; apelidoAplicativo: string }>(
      `/api/integracao/codigos-app/${idTesis}`,
    );
  }

  getPortalAlunoUsuarios(idTesis: string): Observable<PortalAlunoEntry[]> {
    return this.http.get<PortalAlunoUsuarioApi[]>(`/api/integracao/portal-aluno/usuarios/${idTesis}`).pipe(
      map(res => (res || []).map((u, i) => ({
        id: i,
        nomeUsuario: u.nome || '',
        login: u.login || '',
        tipoUsuario: (u.tipoUsuario || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        ativo: true,
      }))),
    );
  }

  getPortalAlunoAdministradores(idTesis: string): Observable<PortalAlunoEntry[]> {
    return this.http.get<PortalAlunoAdminApi[]>(`/api/integracao/portal-aluno/administradores/${idTesis}`).pipe(
      map(res => (res || []).map((a, i) => ({
        id: a.idUsuario ?? i,
        nomeUsuario: a.nome || '',
        login: a.login || '',
        tipoUsuario: 'Administrador',
        ativo: true,
      }))),
    );
  }

  getProfessores(idDiario: number | string, ano: number): Observable<DiarioEntry[]> {
    return this.http.get<ProfessorApi[]>(`/api/integracao/professores/${idDiario}/${ano}`).pipe(
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

  getNotas(idColegio: number, top: number, skip: number): Observable<ColegioNotaPage> {
    return this.http.get<{ itens: ColegioNota[]; total: number }>(`/api/ColegioNotas/${idColegio}?top=${top}&skip=${skip}`).pipe(
      map(res => ({ itens: res.itens || [], total: res.total || 0 })),
    );
  }

  criarNota(payload: ColegioNotaPayload): Observable<ColegioNota> {
    return this.http.post<ColegioNota>('/api/ColegioNotas', payload);
  }

  atualizarNota(id: number, payload: ColegioNotaPayload): Observable<ColegioNota> {
    return this.http.put<ColegioNota>(`/api/ColegioNotas/${id}`, payload);
  }

  excluirNota(id: number): Observable<void> {
    return this.http.delete<void>(`/api/ColegioNotas/${id}`);
  }

  sincronizarParceiros(idColegio: number): Observable<ColegioNota[]> {
    return this.http.post<ColegioNota[]>(`/api/ColegioNotas/${idColegio}/sincronizar-parceiros`, {});
  }

  getParcelas(idColegio: number): Observable<FinanceiroEntry[]> {
    const meses = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return this.http.get<ParcelaApi[]>(`/api/integracao/parcelas/${idColegio}`).pipe(
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

interface PortalAlunoUsuarioApi {
  nome: string;
  login: string;
  senha: string;
  tipoUsuario: string;
}

interface PortalAlunoAdminApi {
  idUsuario: number;
  idCliente: string;
  nome: string;
  login: string;
  senha: string;
  administrador: string;
  professor: string;
  secretaria: string;
  idProfessor: string;
  tipoUsuario: number;
  status: string;
  dataCadastro: string;
}
