import { Projeto, ProjetoMembro, Usuario } from '../models';

export function membrosEfetivos(projeto: Projeto | null | undefined, usuarioAtual?: Usuario | null): ProjetoMembro[] {
  const lista: ProjetoMembro[] = [...(projeto?.membros || [])];

  const adicionar = (usuarioId: number, nome: string, foto?: string, papel = 'Membro') => {
    if (!usuarioId || lista.some(m => m.usuarioId === usuarioId)) return;
    lista.unshift({
      id: 0,
      projetoId: projeto?.id ?? 0,
      usuarioId,
      usuarioNome: nome,
      usuarioFoto: foto,
      papel,
      status: 'Aceito',
    });
  };

  if (projeto?.liderId) {
    adicionar(projeto.liderId, projeto.liderNome || 'Líder', undefined, 'Lider');
  }
  if (usuarioAtual?.id) {
    adicionar(usuarioAtual.id, usuarioAtual.nome, usuarioAtual.foto, 'Membro');
  }

  return lista;
}
