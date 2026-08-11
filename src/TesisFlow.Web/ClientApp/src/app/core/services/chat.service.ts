import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

export interface ContatoChat {
  usuarioId: number;
  nome: string;
  avatar: string;
  ultimaMensagem: string;
  ultimaData: Date;
  naoLidas: number;
}

export interface MensagemChat {
  id: number;
  remetenteId: number;
  remetenteNome: string;
  destinatarioId: number;
  texto: string;
  lida: boolean;
  data: Date;
}

export type StatusUsuario = 'online' | 'offline' | 'ausente' | 'ocupado';

function dataDe(msg: any): Date {
  return new Date(msg.dataCriacao || msg.data || Date.now());
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;

  readonly contatos = signal<ContatoChat[]>([]);
  private _mensagensMap = signal<Record<number, MensagemChat[]>>({});
  readonly digitandoMap = signal<Record<number, boolean>>({});
  readonly statusMap = signal<Record<number, StatusUsuario>>({});
  readonly meuStatus = signal<StatusUsuario>('online');

  readonly conversaAtiva = signal<number | null>(null);
  readonly totalNaoLidas = signal(0);

  private typingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private digitandoAtual = new Set<number>();

  getMensagens(usuarioId: number): MensagemChat[] {
    return this._mensagensMap()[usuarioId] || [];
  }

  getStatus(usuarioId: number): StatusUsuario {
    return this.statusMap()[usuarioId] || 'offline';
  }

  inicializar(): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;

    this.http.get<ContatoChat[]>(`/api/Chat/conversas/${userId}`).subscribe(contatos => {
      this.contatos.set(contatos.map(c => ({
        ...c,
        avatar: c.nome.charAt(0).toUpperCase(),
        ultimaData: c.ultimaData ? new Date(c.ultimaData) : new Date(),
      })));
      this.totalNaoLidas.set(contatos.reduce((s, c) => s + c.naoLidas, 0));

      for (const c of contatos) {
        if (c.naoLidas > 0 || c.ultimaMensagem) {
          this.carregarMensagens(c.usuarioId);
        }
      }
    });

    this.conectarSignalR(userId);
  }

  private conectarSignalR(userId: number): void {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/chat?userId=${userId}`)
      .build();

    this.hubConnection.on('ReceberMensagem', (msg: any) => {
      if (msg.remetenteId === userId) return;
      msg.data = dataDe(msg);
      const outroId = msg.remetenteId;

      this._mensagensMap.update(map => {
        const msgs = [...(map[outroId] || []), msg as MensagemChat];
        return { ...map, [outroId]: msgs };
      });

      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});

      this.contatos.update(lista => {
        const existe = lista.find(c => c.usuarioId === outroId);
        if (existe) {
          return lista.map(c => c.usuarioId === outroId
            ? { ...c, ultimaMensagem: msg.texto, ultimaData: msg.data, naoLidas: c.naoLidas + 1 }
            : c);
        }
        return [...lista, {
          usuarioId: outroId, nome: msg.remetenteNome,
          avatar: msg.remetenteNome.charAt(0).toUpperCase(),
          ultimaMensagem: msg.texto, ultimaData: msg.data, naoLidas: 1,
        }];
      });
      this.totalNaoLidas.update(v => v + 1);
    });

    this.hubConnection.on('UsuarioDigitando', (uid: number, digitando: boolean) => {
      this.digitandoMap.update(map => ({ ...map, [uid]: digitando }));
    });

    this.hubConnection.on('UsuarioOnline', (uid: number, status: StatusUsuario) => {
      this.statusMap.update(map => ({ ...map, [uid]: status }));
    });

    this.hubConnection.on('StatusInicial', (statuses: { usuarioId: number; status: StatusUsuario }[]) => {
      const map: Record<number, StatusUsuario> = {};
      for (const s of statuses) map[s.usuarioId] = s.status;
      this.statusMap.update(() => map);
    });

    this.hubConnection.start().catch(err => console.warn('Chat SignalR erro:', err));
  }

  carregarMensagens(usuarioId: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    this.http.get<any[]>(`/api/Chat/conversas/${meuId}/${usuarioId}`).subscribe(msgs => {
      const normalizadas: MensagemChat[] = msgs.map(m => ({ ...m, data: dataDe(m) }));
      this._mensagensMap.update(map => ({ ...map, [usuarioId]: normalizadas }));
    });
  }

  abrirConversa(usuarioId: number): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;

    this.conversaAtiva.set(usuarioId);

    this.contatos.update(lista => lista.map(c =>
      c.usuarioId === usuarioId ? { ...c, naoLidas: 0 } : c
    ));
    this.totalNaoLidas.set(this.contatos().reduce((s, c) => s + c.naoLidas, 0));

    this.http.put(`/api/Chat/lidas/${usuarioId}/${userId}`, {}).subscribe();

    if (!this._mensagensMap()[usuarioId] || this._mensagensMap()[usuarioId].length === 0) {
      this.carregarMensagens(usuarioId);
    }
  }

  fecharConversa(): void {
    this.conversaAtiva.set(null);
  }

  enviarMensagem(usuarioId: number, texto: string): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    clearTimeout(this.typingTimers.get(usuarioId));
    this.digitandoAtual.delete(usuarioId);
    this.enviarDigitando(usuarioId, false);

    const dto = { texto, remetenteId: meuId, destinatarioId: usuarioId };
    this.http.post<any>('/api/Chat', dto).subscribe(msg => {
      msg.data = dataDe(msg);
      this._mensagensMap.update(map => {
        const msgs = [...(map[usuarioId] || []), msg as MensagemChat];
        return { ...map, [usuarioId]: msgs };
      });
      this.contatos.update(lista => lista.map(c =>
        c.usuarioId === usuarioId ? { ...c, ultimaMensagem: texto, ultimaData: msg.data } : c));
    });
  }

  onInputDigitando(usuarioId: number): void {
    if (this.digitandoAtual.has(usuarioId)) {
      clearTimeout(this.typingTimers.get(usuarioId));
      this.typingTimers.set(usuarioId, setTimeout(() => {
        this.digitandoAtual.delete(usuarioId);
        this.enviarDigitando(usuarioId, false);
      }, 2000));
      return;
    }
    this.digitandoAtual.add(usuarioId);
    this.enviarDigitando(usuarioId, true);
    this.typingTimers.set(usuarioId, setTimeout(() => {
      this.digitandoAtual.delete(usuarioId);
      this.enviarDigitando(usuarioId, false);
    }, 2000));
  }

  private enviarDigitando(usuarioId: number, digitando: boolean): void {
    this.hubConnection?.invoke('EnviarDigitando', usuarioId, digitando).catch(() => {});
  }

  alterarStatus(status: StatusUsuario): void {
    this.meuStatus.set(status);
    this.hubConnection?.invoke('AlterarStatus', status).catch(() => {});
  }

  private cacheUsuarios: { id: number; nome: string }[] | null = null;

  buscarUsuarios(termo: string, excluir?: Set<number>): void {
    const userId = this.auth.usuario()?.id;
    const excl = excluir || new Set();
    if (!userId || !termo || termo.trim().length < 1) {
      this.sugestoesBusca.set([]);
      return;
    }

    const filtrar = (usuarios: { id: number; nome: string }[]) => {
      const t = termo.toLowerCase().trim();
      this.sugestoesBusca.set(
        usuarios
          .filter(u => u.id !== userId && !excl.has(u.id) && u.nome.toLowerCase().includes(t))
          .slice(0, 6)
          .map(u => ({ usuarioId: u.id, nome: u.nome, avatar: u.nome.charAt(0).toUpperCase() }))
      );
    };

    if (this.cacheUsuarios) {
      filtrar(this.cacheUsuarios);
      return;
    }

    this.http.get<any[]>('/api/Usuarios').subscribe(usuarios => {
      this.cacheUsuarios = usuarios.map((u: any) => ({ id: u.id, nome: u.nome }));
      filtrar(this.cacheUsuarios);
    });
  }

  readonly sugestoesBusca = signal<{ usuarioId: number; nome: string; avatar: string }[]>([]);
}
