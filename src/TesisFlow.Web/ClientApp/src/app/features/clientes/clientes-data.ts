export interface Cliente {
  id: number;
  nome: string;
  apelido: string;
  status: string;
  situacao: string;
  estado: string;
  cidade: string;
  contato: string;
  telefone: string;
  codigoDiario: string;
  senhaMasterDiario: string;
  codigoPortalAluno: string;
  codigoAplicativo: string;
  apelidoAplicativo: string;
  email: string;
  linkTGE: string;
  cnpj: string;
  endereco: string;
  bairro: string;
  cep: string;
  idTesis: string;
  idDiarioRaw: number | null;
}

export interface Atendimento {
  id: number;
  titulo: string;
  descricao: string;
  protocolo: string;
  usuario: string;
  usuarioFoto?: string | null;
  data: string;
  idStatusContato: number;
  nomeContato: string;
}

export interface DiarioEntry {
  id: string;
  professorId: string;
  nome: string;
  telefone: string;
  celular: string;
  email: string;
  ativo: string;
  senha: string;
}

export interface PortalAlunoEntry {
  id: number;
  nomeUsuario: string;
  login: string;
  tipoUsuario: string;
  ativo: boolean;
}

export interface FinanceiroEntry {
  id: number;
  descricao: string;
  vencimento: string;
  mes: string;
  ano: number;
  valorReal: number;
  valorAtual: number;
  valorPago: number;
  dataPagamento: string | null;
  statusParcela: string;
  urlBoleto: string;
}

export const STATUS_CONTATO_OPTIONS = [
  { value: 0, label: 'Realizado' },
  { value: 1, label: 'Pendente' },
  { value: 2, label: 'Aguardando' },
  { value: 3, label: 'Backup' },
  { value: 4, label: 'Desenvolvimento' },
  { value: 5, label: 'Tarefa' },
];

export const CLIENTES_MOCK: Cliente[] = [
  {
    id: 1, nome: 'Escola Municipal Mario Quintana', apelido: 'EMEF Mario Quintana', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'RS', cidade: 'Porto Alegre',
    contato: 'Halina', telefone: '(32) 3264-1166', codigoDiario: '3126859', senhaMasterDiario: '03%126.859>',
    codigoPortalAluno: '03126859000130', codigoAplicativo: 'APP-001', apelidoAplicativo: 'Mario Quintana App',
    email: 'halina@marioquintana.edu.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=ae5e46ef-b0a2-4923-8244-922a76be7523',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 2, nome: 'Colegio Estadual Castro Alves', apelido: 'CE Castro Alves', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'BA', cidade: 'Salvador',
    contato: 'Marcos', telefone: '(71) 3321-4455', codigoDiario: '4512789', senhaMasterDiario: '87#451.278>',
    codigoPortalAluno: '04512789000155', codigoAplicativo: 'APP-002', apelidoAplicativo: 'Castro Alves Digital',
    email: 'marcos@castroalves.ba.gov.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=b1f3a21c-d4e5-6789-abcd-ef0123456789',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 3, nome: 'Instituto Educacional Monteiro Lobato', apelido: 'IE Monteiro Lobato', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'SP', cidade: 'Sao Paulo',
    contato: 'Carla', telefone: '(11) 4112-7890', codigoDiario: '7890123', senhaMasterDiario: '12$789.012>',
    codigoPortalAluno: '07890123000189', codigoAplicativo: 'APP-003', apelidoAplicativo: 'Lobato Ensino',
    email: 'carla@monteirolobato.edu.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=c2d4b5e6-f7a8-9012-bcde-f12345678901',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 4, nome: 'Escola Tecnica Professor Ruy Leite', apelido: 'ETEC Ruy Leite', status: 'Inativo', situacao: 'CANCELADO', estado: 'SP', cidade: 'Campinas',
    contato: 'Roberto', telefone: '(19) 3256-9900', codigoDiario: '5678901', senhaMasterDiario: '45!567.890>',
    codigoPortalAluno: '05678901000122', codigoAplicativo: 'APP-004', apelidoAplicativo: 'Ruy Leite Tec',
    email: 'roberto@ruyleite.sp.gov.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=d3e5c6f7-a8b9-0123-cdef-456789012345',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 5, nome: 'Colegio Militar de Porto Alegre', apelido: 'CMPA', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'RS', cidade: 'Porto Alegre',
    contato: 'Cel. Andrade', telefone: '(51) 3322-1100', codigoDiario: '8901234', senhaMasterDiario: '67@890.123>',
    codigoPortalAluno: '08901234000145', codigoAplicativo: 'APP-005', apelidoAplicativo: 'CMPA Portal',
    email: 'andrade@cmpa.mil.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=e4f6d7a8-b9c0-1234-def0-567890123456',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 6, nome: 'Escola Estadual Professora Leopoldina', apelido: 'EE Prof Leopoldina', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'MG', cidade: 'Belo Horizonte',
    contato: 'Amanda', telefone: '(31) 3344-5566', codigoDiario: '2345678', senhaMasterDiario: '90#234.567>',
    codigoPortalAluno: '02345678000178', codigoAplicativo: 'APP-006', apelidoAplicativo: 'Leopoldina App',
    email: 'amanda@leopoldina.mg.gov.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=f5a7b8c9-d0e1-2345-ef01-678901234567',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 7, nome: 'Centro Educacional Paulo Freire', apelido: 'CE Paulo Freire', status: 'Inativo', situacao: 'CANCELADO', estado: 'BA', cidade: 'Feira de Santana',
    contato: 'Juliana', telefone: '(75) 3601-2233', codigoDiario: '6789012', senhaMasterDiario: '11%678.901>',
    codigoPortalAluno: '06789012000191', codigoAplicativo: 'APP-007', apelidoAplicativo: 'Freire Educa',
    email: 'juliana@paulofreire.ba.gov.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=a6b8c9d0-e1f2-3456-a012-789012345678',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 8, nome: 'Instituto Federal de Sao Paulo', apelido: 'IFSP', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'SP', cidade: 'Sao Paulo',
    contato: 'Dr. Ricardo', telefone: '(11) 3775-8800', codigoDiario: '9012345', senhaMasterDiario: '22$901.234>',
    codigoPortalAluno: '09012345000114', codigoAplicativo: 'APP-008', apelidoAplicativo: 'IFSP Digital',
    email: 'ricardo@ifsp.edu.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=b7c9d0e1-f2a3-4567-b123-890123456789',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 9, nome: 'Colegio Adventista da Liberdade', apelido: 'CAL', status: 'Ativo', situacao: 'CLIENTE ATIVO', estado: 'MG', cidade: 'Uberlandia',
    contato: 'Pastor Samuel', telefone: '(34) 3239-4400', codigoDiario: '3456789', senhaMasterDiario: '33!345.678>',
    codigoPortalAluno: '03456789000137', codigoAplicativo: 'APP-009', apelidoAplicativo: 'CAL Educa',
    email: 'samuel@cal.edu.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=c8d0e1f2-a3b4-5678-c234-901234567890',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
  {
    id: 10, nome: 'Escola Basica Municipal Machado de Assis', apelido: 'EBM Machado de Assis', status: 'Inativo', situacao: 'CANCELADO', estado: 'RS', cidade: 'Caxias do Sul',
    contato: 'Lucia', telefone: '(54) 3221-6655', codigoDiario: '1234567', senhaMasterDiario: '44@123.456>',
    codigoPortalAluno: '01234567000160', codigoAplicativo: 'APP-010', apelidoAplicativo: 'Machado App',
    email: 'lucia@machadodeassis.rs.gov.br', linkTGE: 'https://escolananuvem.tesis.inf.br/?q=d9e1f2a3-b4c5-6789-d345-012345678901',
    cnpj: '', endereco: '', bairro: '', cep: '', idTesis: '', idDiarioRaw: null,
  },
];
