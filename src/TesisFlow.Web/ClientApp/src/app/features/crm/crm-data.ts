export interface AtendimentoCrm {
  id: number;
  colegioId: number;
  colegioNome: string;
  titulo: string;
  descricao: string;
  status: number;
  nomeContato: string | null;
  usuarioId: number;
  usuarioNome: string;
  tipoInteracao: number | null;
  canal: number | null;
  resultado: number | null;
  contatoId: number | null;
  atendimentoOrigemId: number | null;
  proximoContatoData: string | null;
  proximoContatoHora: string | null;
  proximoContatoMotivo: string | null;
  retornoConcluido: boolean;
  dataCriacao: string;
  dataAtualizacao?: string | null;
}

export interface AtendimentoCrmPayload {
  colegioId: number;
  colegioNome: string;
  titulo: string;
  descricao: string;
  status: number;
  nomeContato: string | null;
  tipoInteracao: number | null;
  canal: number | null;
  resultado: number | null;
  contatoId: number | null;
  atendimentoOrigemId: number | null;
  proximoContatoData: string | null;
  proximoContatoHora: string | null;
  proximoContatoMotivo: string | null;
  retornoConcluido: boolean;
}

export interface Contato {
  id: number;
  colegioId: number;
  nome: string;
  telefone: string | null;
  email: string | null;
  cargo: string | null;
}

export const STATUS_ATENDIMENTO_OPTIONS = [
  { value: 0, label: 'Novo' },
  { value: 1, label: 'Em andamento' },
  { value: 2, label: 'Aguardando' },
  { value: 3, label: 'Resolvido' },
  { value: 4, label: 'Cancelado' },
];

export const TIPO_INTERACAO_OPTIONS = [
  { value: 0, label: 'Primeiro contato' },
  { value: 1, label: 'Retorno' },
  { value: 2, label: 'Ligação' },
  { value: 3, label: 'Apresentação' },
  { value: 4, label: 'Envio de proposta' },
  { value: 5, label: 'Negociação' },
  { value: 6, label: 'Outro' },
];

export const CANAL_OPTIONS = [
  { value: 0, label: 'WhatsApp' },
  { value: 1, label: 'Telefone' },
  { value: 2, label: 'E-mail' },
  { value: 3, label: 'Presencial' },
  { value: 4, label: 'Outro' },
];

export const RESULTADO_OPTIONS = [
  { value: 0, label: 'Sem resposta' },
  { value: 1, label: 'Demonstrou interesse' },
  { value: 2, label: 'Solicitou retorno' },
  { value: 3, label: 'Reunião agendada' },
  { value: 4, label: 'Não tem interesse' },
  { value: 5, label: 'Outro' },
];

export function statusAtendimentoLabel(status: number): string {
  return STATUS_ATENDIMENTO_OPTIONS.find(o => o.value === status)?.label || 'Desconhecido';
}

export function statusAtendimentoClasse(status: number): string {
  switch (status) {
    case 0: return 'status-novo';
    case 1: return 'status-andamento';
    case 2: return 'status-aguardando';
    case 3: return 'status-resolvido';
    case 4: return 'status-cancelado';
    default: return '';
  }
}

export function tipoInteracaoLabel(tipo: number | null | undefined): string {
  if (tipo == null) return '-';
  return TIPO_INTERACAO_OPTIONS.find(o => o.value === tipo)?.label || 'Outro';
}

export function canalLabel(canal: number | null | undefined): string {
  if (canal == null) return '-';
  return CANAL_OPTIONS.find(o => o.value === canal)?.label || 'Outro';
}

export function resultadoLabel(resultado: number | null | undefined): string {
  if (resultado == null) return '-';
  return RESULTADO_OPTIONS.find(o => o.value === resultado)?.label || 'Outro';
}

export interface EscolaCrm {
  id: number;
  colegioId: number;
  colegioNome: string;
  etapaComercial: number;
  responsavelId: number | null;
  responsavelNome: string | null;
  contatoPrincipalId: number | null;
  contatoPrincipalNome: string | null;
  motivoEncerramento: string | null;
  motivoObservacao: string | null;
  dataConversao: string | null;
  ultimoContato: string | null;
  proximoContato: string | null;
  dataCriacao: string;
  dataAtualizacao?: string | null;
}

export interface EscolaCrmPayload {
  colegioId: number;
  colegioNome: string;
  etapaComercial: number;
  responsavelId: number | null;
  responsavelNome: string | null;
  contatoPrincipalId: number | null;
  contatoPrincipalNome: string | null;
  motivoEncerramento: string | null;
  motivoObservacao: string | null;
  dataConversao: string | null;
}

export interface EscolaCrmResumo {
  totalProspeccao: number;
  naoContatadas: number;
  emAcompanhamento: number;
  interessadas: number;
  emNegociacao: number;
  clientesConquistados: number;
  retornosAtrasados: number;
}

export const ETAPA_OPTIONS = [
  { value: 0, label: 'Não contatada' },
  { value: 1, label: 'Primeiro contato' },
  { value: 2, label: 'Em acompanhamento' },
  { value: 3, label: 'Interessada' },
  { value: 4, label: 'Em negociação' },
  { value: 5, label: 'Cliente conquistado' },
  { value: 6, label: 'Não interessado' },
  { value: 7, label: 'Oportunidade perdida' },
];

export const KANBAN_ETAPAS = [0, 1, 2, 3, 4, 5];

export const MOTIVO_ENCERRAMENTO_OPTIONS = [
  'Já utiliza outro sistema',
  'Não possui interesse no momento',
  'Valor fora do orçamento',
  'Não conseguiu contato com o responsável',
  'Adiou a decisão',
  'Outro',
];

export function etapaLabel(etapa: number): string {
  return ETAPA_OPTIONS.find(o => o.value === etapa)?.label || 'Desconhecida';
}

export function etapaClasse(etapa: number): string {
  switch (etapa) {
    case 0: return 'etapa-nao-contatada';
    case 1: return 'etapa-primeiro';
    case 2: return 'etapa-acompanhamento';
    case 3: return 'etapa-interessada';
    case 4: return 'etapa-negociacao';
    case 5: return 'etapa-conquistado';
    case 6: return 'etapa-nao-interessado';
    case 7: return 'etapa-perdida';
    default: return '';
  }
}
