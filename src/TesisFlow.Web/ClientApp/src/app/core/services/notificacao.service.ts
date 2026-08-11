import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

export interface Notificacao {
  id: number;
  titulo: string;
  descricao: string;
  data: Date;
  lida: boolean;
  tipo: 'atendimento' | 'financeiro' | 'diario' | 'sistema' | 'tarefa' | 'mencao' | 'atribuicao';
  link?: string;
  targetUserId?: number;
}

interface NotificacaoRaw {
  id: number;
  titulo: string;
  descricao: string;
  dataCriacao: string;
  data?: string;
  lida: boolean;
  tipo: string;
  link?: string;
  targetUserId?: number;
}

function normalizar(n: NotificacaoRaw): Notificacao {
  return {
    id: n.id,
    titulo: n.titulo,
    descricao: n.descricao,
    data: new Date(n.dataCriacao || n.data || Date.now()),
    lida: n.lida,
    tipo: n.tipo as Notificacao['tipo'],
    link: n.link,
    targetUserId: n.targetUserId,
  };
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;

  private _notificacoes = signal<Notificacao[]>([]);

  readonly notificacoes = this._notificacoes.asReadonly();
  readonly apenasNaoLidas = signal(false);

  get notificacoesFiltradas(): Notificacao[] {
    const lista = this._notificacoes();
    return this.apenasNaoLidas() ? lista.filter(n => !n.lida) : lista;
  }

  get naoLidasCount(): number {
    return this._notificacoes().filter(n => !n.lida).length;
  }

  inicializar(): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;

    this.http.get<NotificacaoRaw[]>(`/api/Notificacoes/usuario/${userId}`).subscribe(notifs => {
      this._notificacoes.set(notifs.map(normalizar));
    });

    this.conectarSignalR(userId);
  }

  private conectarSignalR(userId: number): void {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/notificacoes?userId=${userId}`)
      .build();

    this.hubConnection.on('ReceberNotificacao', (notificacao: NotificacaoRaw) => {
      this._notificacoes.update(lista => [
        normalizar(notificacao),
        ...lista,
      ]);
      const audio = new Audio('/sounds/notification-new.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    });

    this.hubConnection.start().catch(err => console.warn('SignalR erro:', err));
  }

  criar(notificacao: Omit<Notificacao, 'id'>): void {
    this.http.post<Notificacao>('/api/Notificacoes', notificacao).subscribe();
  }

  alternarLida(id: number): void {
    this.http.put(`/api/Notificacoes/${id}/lida`, {}).subscribe(() => {
      this._notificacoes.update(lista => lista.map(n => n.id === id ? { ...n, lida: !n.lida } : n));
    });
  }

  marcarTodasLidas(): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;

    this.http.put(`/api/Notificacoes/usuario/${userId}/lidas`, {}).subscribe(() => {
      this._notificacoes.update(lista => lista.map(n => ({ ...n, lida: true })));
    });
  }
}
