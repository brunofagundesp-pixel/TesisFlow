import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Categoria, CategoriaSave } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private api = inject(ApiService);

  listarPorProjeto(projetoId: number): Observable<Categoria[]> {
    return this.api.get<Categoria[]>(`Categorias/projeto/${projetoId}`);
  }

  criar(projetoId: number, dto: CategoriaSave): Observable<Categoria> {
    return this.api.post<Categoria>('Categorias', { ...dto, projetoId });
  }

  atualizar(id: number, dto: CategoriaSave): Observable<Categoria> {
    return this.api.put<Categoria>(`Categorias/${id}`, dto);
  }

  excluir(id: number, novaCategoriaId?: number): Observable<void> {
    return this.api.post<void>(`Categorias/${id}/excluir`, { novaCategoriaId: novaCategoriaId ?? null });
  }
}
