import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Anexo } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class AnexoService {
  constructor(private api: ApiService) {}

  listar(tarefaId: number): Observable<Anexo[]> {
    return this.api.get<Anexo[]>(`Anexos/tarefa/${tarefaId}`);
  }

  upload(tarefaId: number, arquivo: File, usuarioId: number): Observable<Anexo> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('usuarioId', usuarioId.toString());
    return this.api.postFormData<Anexo>(`Anexos/upload/${tarefaId}`, form);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`Anexos/${id}`);
  }
}
