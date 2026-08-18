import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Projeto, ProjetoSave } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class ProjetoService {
  constructor(private api: ApiService) {}

  listar(): Observable<Projeto[]> {
    return this.api.get<Projeto[]>('Projetos');
  }

  obter(id: number): Observable<Projeto> {
    return this.api.get<Projeto>(`Projetos/${id}`);
  }

  listarPorUsuario(usuarioId: number): Observable<Projeto[]> {
    return this.api.get<Projeto[]>(`Projetos/usuario/${usuarioId}`);
  }

  criar(dto: ProjetoSave): Observable<Projeto> {
    return this.api.post<Projeto>('Projetos', dto);
  }

  atualizar(id: number, dto: ProjetoSave): Observable<Projeto> {
    return this.api.put<Projeto>(`Projetos/${id}`, dto);
  }

  excluir(id: number, email: string): Observable<void> {
    return this.api.delete<void>(`Projetos/${id}?email=${encodeURIComponent(email)}`);
  }

  convidarMembro(projetoId: number, email: string): Observable<void> {
    return this.api.post<void>(`Projetos/${projetoId}/membros`, { email });
  }

  aceitarConvite(projetoId: number, usuarioId: number): Observable<void> {
    return this.api.put<void>(`Projetos/${projetoId}/membros/aceitar`, { usuarioId });
  }

  recusarConvite(projetoId: number, usuarioId: number): Observable<void> {
    return this.api.put<void>(`Projetos/${projetoId}/membros/recusar`, { usuarioId });
  }
}
