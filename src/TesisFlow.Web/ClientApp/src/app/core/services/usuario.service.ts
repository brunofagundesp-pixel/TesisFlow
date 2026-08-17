import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario } from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  constructor(private api: ApiService) {}

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
