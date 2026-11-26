import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AtendimentoCrm, AtendimentoCrmPayload, Contato, EscolaCrm, EscolaCrmPayload, EscolaCrmResumo } from './crm-data';

export interface AtendimentoCrmPage {
  itens: AtendimentoCrm[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CrmService {
  private http = inject(HttpClient);

  listar(filtros: { busca?: string; status?: number; colegioId?: number }, top: number, skip: number): Observable<AtendimentoCrmPage> {
    let params = new HttpParams().set('top', top.toString()).set('skip', skip.toString());
    if (filtros.busca) params = params.set('busca', filtros.busca);
    if (filtros.status != null) params = params.set('status', filtros.status.toString());
    if (filtros.colegioId != null) params = params.set('colegioId', filtros.colegioId.toString());

    return this.http.get<AtendimentoCrmPage>('/api/Crm', { params });
  }

  listarPorColegio(colegioId: number, top: number, skip: number): Observable<AtendimentoCrmPage> {
    const params = new HttpParams().set('top', top.toString()).set('skip', skip.toString());
    return this.http.get<AtendimentoCrmPage>(`/api/Crm/colegio/${colegioId}`, { params });
  }

  listarRetornos(usuarioId: number): Observable<AtendimentoCrm[]> {
    return this.http.get<AtendimentoCrm[]>(`/api/Crm/retornos/${usuarioId}`);
  }

  listarContatos(colegioId: number): Observable<Contato[]> {
    return this.http.get<Contato[]>(`/api/Contatos/colegio/${colegioId}`);
  }

  criarContato(payload: { colegioId: number; nome: string; telefone?: string | null; email?: string | null; cargo?: string | null }): Observable<Contato> {
    return this.http.post<Contato>('/api/Contatos', payload);
  }

  atualizarContato(id: number, payload: { colegioId: number; nome: string; telefone?: string | null; email?: string | null; cargo?: string | null }): Observable<Contato> {
    return this.http.put<Contato>(`/api/Contatos/${id}`, payload);
  }

  excluirContato(id: number): Observable<void> {
    return this.http.delete<void>(`/api/Contatos/${id}`);
  }

  listarEscolasCrm(): Observable<EscolaCrm[]> {
    return this.http.get<EscolaCrm[]>('/api/EscolaCrm');
  }

  obterEscolaCrmPorColegio(colegioId: number): Observable<EscolaCrm> {
    return this.http.get<EscolaCrm>(`/api/EscolaCrm/colegio/${colegioId}`);
  }

  obterResumo(): Observable<EscolaCrmResumo> {
    return this.http.get<EscolaCrmResumo>('/api/EscolaCrm/resumo');
  }

  criarEscolaCrm(payload: EscolaCrmPayload): Observable<EscolaCrm> {
    return this.http.post<EscolaCrm>('/api/EscolaCrm', payload);
  }

  atualizarEscolaCrm(id: number, payload: EscolaCrmPayload): Observable<EscolaCrm> {
    return this.http.put<EscolaCrm>(`/api/EscolaCrm/${id}`, payload);
  }

  excluirEscolaCrm(id: number): Observable<void> {
    return this.http.delete<void>(`/api/EscolaCrm/${id}`);
  }

  criar(payload: AtendimentoCrmPayload): Observable<AtendimentoCrm> {
    return this.http.post<AtendimentoCrm>('/api/Crm', payload);
  }

  atualizar(id: number, payload: AtendimentoCrmPayload): Observable<AtendimentoCrm> {
    return this.http.put<AtendimentoCrm>(`/api/Crm/${id}`, payload);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/api/Crm/${id}`);
  }
}
