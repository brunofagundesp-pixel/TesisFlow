import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Sprint, SprintSave } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class SprintService {
  constructor(private api: ApiService) {}

  listarPorProjeto(projetoId: number): Observable<Sprint[]> {
    return this.api.get<Sprint[]>(`Sprints/projeto/${projetoId}`);
  }

  obter(id: number): Observable<Sprint> {
    return this.api.get<Sprint>(`Sprints/${id}`);
  }

  criar(dto: SprintSave): Observable<Sprint> {
    return this.api.post<Sprint>('Sprints', dto);
  }

  atualizar(id: number, dto: SprintSave): Observable<Sprint> {
    return this.api.put<Sprint>(`Sprints/${id}`, dto);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`Sprints/${id}`);
  }
}
