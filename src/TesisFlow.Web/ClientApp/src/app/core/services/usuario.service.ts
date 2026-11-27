import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, UsuarioAdmin, UsuarioCriar } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

  listarAdmin(): Observable<UsuarioAdmin[]> {
    return this.api.get<UsuarioAdmin[]>('Usuarios/admin');
  }

  criar(dto: UsuarioCriar): Observable<Usuario> {
    return this.api.post<Usuario>('Usuarios', dto);
  }

  excluir(usuarioId: number): Observable<void> {
    return this.api.delete<void>(`Usuarios/${usuarioId}`);
  }

  definirTesisCcSid(usuarioId: number, tesisCcSid: string | null): Observable<void> {
    return this.api.put<void>(`Usuarios/${usuarioId}/tesisccsid`, { tesisCcSid });
  }

  definirCargo(usuarioId: number, cargo: string | null): Observable<Usuario> {
    return this.api.put<Usuario>(`Usuarios/${usuarioId}/cargo`, { cargo });
  }

  atualizarFoto(usuarioId: number, arquivo: File): Observable<Usuario> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.api.postFormData<Usuario>(`Usuarios/${usuarioId}/foto`, form);
  }

  removerFoto(usuarioId: number): Observable<Usuario> {
    return this.api.delete<Usuario>(`Usuarios/${usuarioId}/foto`);
  }

  atualizarBanner(usuarioId: number, arquivo: File): Observable<Usuario> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.api.postFormData<Usuario>(`Usuarios/${usuarioId}/banner`, form);
  }

  removerBanner(usuarioId: number): Observable<Usuario> {
    return this.api.delete<Usuario>(`Usuarios/${usuarioId}/banner`);
  }
}
