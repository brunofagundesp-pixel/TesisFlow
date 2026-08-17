import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Tarefa, TarefaSave, TarefaMove, StatusTarefa, PrioridadeTarefa } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class TarefaService {
  constructor(private api: ApiService) {}

  listarPorProjeto(projetoId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/projeto/${projetoId}`);
  }

  obter(id: number): Observable<Tarefa> {
    return this.api.get<Tarefa>(`Tarefas/${id}`);
  }

  obterPorChave(chave: string): Observable<Tarefa> {
    return this.api.get<Tarefa>(`Tarefas/chave/${encodeURIComponent(chave)}`);
  }

  listarPorSprint(sprintId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/sprint/${sprintId}`);
  }

  listarPorResponsavel(usuarioId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/responsavel/${usuarioId}`);
  }

  listarMeuDia(usuarioId: number): Observable<number[]> {
    return this.api.get<number[]>(`Tarefas/meu-dia/${usuarioId}`);
  }

  listarMeuDiaTarefas(usuarioId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/meu-dia/${usuarioId}/tarefas`);
  }

  listarLixeira(usuarioId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/lixeira/${usuarioId}`);
  }

  restaurar(id: number): Observable<Tarefa> {
    return this.api.post<Tarefa>(`Tarefas/${id}/restaurar`, {});
  }

  excluirDefinitivamente(id: number): Observable<void> {
    return this.api.delete<void>(`Tarefas/${id}/definitivo`);
  }

  alternarMeuDia(tarefaId: number, usuarioId: number): Observable<{ ativo: boolean }> {
    return this.api.put<{ ativo: boolean }>('Tarefas/meu-dia/toggle', { tarefaId, usuarioId });
  }

  criar(dto: TarefaSave): Observable<Tarefa> {
    return this.api.post<Tarefa>('Tarefas', dto);
  }

  atualizar(id: number, dto: TarefaSave): Observable<Tarefa> {
    return this.api.put<Tarefa>(`Tarefas/${id}`, dto);
  }

  mover(dto: TarefaMove): Observable<void> {
    return this.api.put<void>('Tarefas/mover', dto);
  }

  reordenar(itens: TarefaMove[]): Observable<void> {
    return this.api.put<void>('Tarefas/reordenar', itens);
  }

  alterarStatusEmMassa(ids: number[], status: StatusTarefa, usuarioId?: number): Observable<void> {
    return this.api.put<void>('Tarefas/em-massa/status', { ids, valor: status, usuarioId });
  }

  alterarPrioridadeEmMassa(ids: number[], prioridade: PrioridadeTarefa, usuarioId?: number): Observable<void> {
    return this.api.put<void>('Tarefas/em-massa/prioridade', { ids, valor: prioridade, usuarioId });
  }

  excluirEmMassa(ids: number[]): Observable<void> {
    return this.api.post<void>('Tarefas/em-massa/excluir', { ids });
  }

  buscar(termo: string, usuarioId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/buscar?termo=${encodeURIComponent(termo)}&usuarioId=${usuarioId}`);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`Tarefas/${id}`);
  }
}
