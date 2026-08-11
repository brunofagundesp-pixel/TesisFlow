import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Comentario, ComentarioSave, Reacao, ReacaoSave } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ComentarioService {
  constructor(private api: ApiService) {}

  listar(tarefaId: number): Observable<Comentario[]> {
    return this.api.get<Comentario[]>(`Comentarios/tarefa/${tarefaId}`);
  }

  criar(dto: ComentarioSave): Observable<Comentario> {
    return this.api.post<Comentario>('Comentarios', dto);
  }

  atualizar(id: number, dto: ComentarioSave): Observable<Comentario> {
    return this.api.put<Comentario>(`Comentarios/${id}`, dto);
  }

  excluir(id: number, usuarioId: number): Observable<void> {
    return this.api.delete<void>(`Comentarios/${id}?usuarioId=${usuarioId}`);
  }

  reagir(comentarioId: number, dto: ReacaoSave): Observable<Reacao[]> {
    return this.api.post<Reacao[]>(`Comentarios/${comentarioId}/reacoes`, dto);
  }

  listarReacoes(comentarioId: number): Observable<Reacao[]> {
    return this.api.get<Reacao[]>(`Comentarios/${comentarioId}/reacoes`);
  }
}
