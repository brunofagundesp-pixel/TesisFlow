import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Tarefa, TarefaSave, TarefaMove } from '../../core/models';

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

  criar(dto: TarefaSave): Observable<Tarefa> {
    return this.api.post<Tarefa>('Tarefas', dto);
  }

  atualizar(id: number, dto: TarefaSave): Observable<Tarefa> {
    return this.api.put<Tarefa>(`Tarefas/${id}`, dto);
  }

  mover(dto: TarefaMove): Observable<void> {
    return this.api.put<void>('Tarefas/mover', dto);
  }

  buscar(termo: string, usuarioId: number): Observable<Tarefa[]> {
    return this.api.get<Tarefa[]>(`Tarefas/buscar?termo=${encodeURIComponent(termo)}&usuarioId=${usuarioId}`);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`Tarefas/${id}`);
  }
}
