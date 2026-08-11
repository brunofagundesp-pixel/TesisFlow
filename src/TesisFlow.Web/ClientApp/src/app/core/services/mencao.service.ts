import { Injectable, inject } from '@angular/core';
import { NotificacaoService } from './notificacao.service';

interface MembroInfo {
  usuarioId: number;
  usuarioNome: string;
}

@Injectable({ providedIn: 'root' })
export class MencaoService {
  private notificacaoService = inject(NotificacaoService);

  processarMencoes(
    html: string,
    membros: MembroInfo[],
    tarefaChave: string,
    tarefaTitulo: string,
    autorId: number,
    projetoNome: string,
  ): void {
    if (!html || !membros.length) return;

    const texto = this.htmlToText(html);

    for (const membro of membros) {
      if (membro.usuarioId === autorId) continue;
      const nome = this.escapeRegex(membro.usuarioNome.toLowerCase());
      const regex = new RegExp(`@${nome}\\b`, 'gi');
      if (regex.test(texto)) {
        const trecho = texto.length > 80 ? texto.substring(0, 80) + '...' : texto;

        this.notificacaoService.criar({
          titulo: `@${membro.usuarioNome} mencionou você em um comentário`,
          descricao: `"${trecho}" — em ${tarefaTitulo} • ${projetoNome}`,
          data: new Date(),
          lida: false,
          tipo: 'mencao',
          link: `/tarefas/${tarefaChave}`,
          targetUserId: membro.usuarioId,
        });
      }
    }
  }

  private htmlToText(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
