export interface Usuario {
  id: number;
  nome: string;
  email: string;
  foto?: string;
  banner?: string;
  cargo?: string;
  ativo: boolean;
}

export interface UsuarioLogin {
  email: string;
  senha: string;
}

export interface UsuarioRegistro {
  nome: string;
  email: string;
  senha: string;
}

export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  liderId: number;
  liderNome: string;
  ativo: boolean;
  quantidadeTarefas: number;
  quantidadeMembros: number;
  membros?: ProjetoMembro[];
}

export interface ProjetoSave {
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  liderId: number;
  quadros?: QuadroConfiguracaoSave[];
}

export interface ProjetoMembro {
  id: number;
  projetoId: number;
  usuarioId: number;
  usuarioNome: string;
  usuarioFoto?: string;
  papel: string;
}

export interface TarefaResponsavel {
  id: number;
  nome: string;
  foto?: string;
}

export interface Tarefa {
  id: number;
  titulo: string;
  chave?: string;
  descricao?: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  tipo: number;
  categoriaNome?: string;
  categoriaIcone?: string;
  categoriaCor?: string;
  ordem: number;
  projetoId: number;
  projetoNome: string;
  sprintId?: number;
  sprintNome?: string;
  responsaveis: TarefaResponsavel[];
  criadorId: number;
  criadorNome: string;
  colegioId?: number;
  colegioNome?: string;
  contatoNome?: string;
  dataConclusao?: string;
  dataEntrega?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  dataExclusao?: string;
  quantidadeComentarios: number;
  criando?: boolean;
}

export interface TarefaSave {
  titulo: string;
  descricao?: string;
  status: StatusTarefa;
  prioridade: PrioridadeTarefa;
  tipo: number;
  projetoId: number;
  sprintId?: number;
  responsavelIds: number[];
  criadorId: number;
  atorId?: number;
  colegioId?: number;
  colegioNome?: string;
  contatoNome?: string;
  dataEntrega?: string;
}

export interface ColegioRef {
  id: number;
  nome: string;
}

export interface TarefaMove {
  id: number;
  status: StatusTarefa;
  ordem: number;
  usuarioId?: number;
}

export interface Sprint {
  id: number;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  projetoId: number;
  projetoNome: string;
  ativo: boolean;
  quantidadeTarefas: number;
}

export interface SprintSave {
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  projetoId: number;
}

export interface Comentario {
  id: number;
  texto: string;
  tarefaId: number;
  usuarioId: number;
  usuarioNome: string;
  usuarioFoto?: string;
  comentarioPaiId?: number;
  curtidas: number;
  dataCriacao: string;
}

export interface ComentarioSave {
  texto: string;
  tarefaId: number;
  usuarioId: number;
  comentarioPaiId?: number;
}

export enum StatusTarefa {
  Backlog = 1,
  Fazer = 2,
  Andamento = 3,
  Revisao = 4,
  Feito = 5,
  Cancelado = 6,
}

export enum PrioridadeTarefa {
  Baixa = 1,
  Media = 2,
  Alta = 3,
  Critica = 4,
}

export interface Categoria {
  id: number;
  projetoId: number;
  nome: string;
  icone: string;
  cor: string;
  quantidadeTarefas?: number;
  ativo: boolean;
}

export interface CategoriaSave {
  nome: string;
  icone: string;
  cor: string;
}

export interface QuadroConfiguracao {
  id: number;
  projetoId: number;
  status: StatusTarefa;
  titulo: string;
  ordem: number;
  visivel: boolean;
}

export interface QuadroConfiguracaoSave {
  status: StatusTarefa;
  titulo: string;
  ordem: number;
  visivel: boolean;
}

export interface Anexo {
  id: number;
  tarefaId: number;
  nomeArquivo: string;
  tipo: string;
  tamanho: number;
  usuarioId: number;
  usuarioNome: string;
  dataCriacao: string;
}

export interface HistoricoTarefa {
  id: number;
  tarefaId: number;
  campo: string;
  valorAntigo?: string;
  valorNovo?: string;
  usuarioId: number;
  usuarioNome: string;
  dataCriacao: string;
}

export interface Reacao {
  emoji: string;
  quantidade: number;
  usuarios: { usuarioId: number; usuarioNome: string }[];
}

export interface ReacaoSave {
  emoji: string;
  usuarioId: number;
}
