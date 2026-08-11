import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { HistoricoTarefa } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class HistoricoTarefaService {
  constructor(private api: ApiService) {}

  listar(tarefaId: number): Observable<HistoricoTarefa[]> {
    return this.api.get<HistoricoTarefa[]>(`HistoricoTarefas/tarefa/${tarefaId}`);
  }
}
