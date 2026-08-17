import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, UsuarioLogin, UsuarioRegistro } from '../models';

const STORAGE_KEY = 'tesisflow_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _usuario = signal<Usuario | null>(this.carregarDaStorage());
  readonly usuario = computed(() => this._usuario());
  readonly logado = computed(() => !!this._usuario());
  readonly isMaster = computed(() => this._usuario()?.email === 'bruno.tesis@hotmail.com');

  constructor(private api: ApiService, private router: Router) {}

  login(dto: UsuarioLogin): Observable<{ token: string; usuario: Usuario }> {
    return this.api.post<{ token: string; usuario: Usuario }>('Auth/login', dto).pipe(
      tap(res => {
        this.salvarSessao(res.usuario);
        this._usuario.set(res.usuario);
      })
    );
  }

  registro(dto: UsuarioRegistro): Observable<Usuario> {
    return this.api.post<Usuario>('Auth/registro', dto);
  }

  atualizarUsuario(usuario: Usuario): void {
    this._usuario.set(usuario);
    this.salvarSessao(usuario);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  private salvarSessao(usuario: Usuario): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
  }

  private carregarDaStorage(): Usuario | null {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
}
