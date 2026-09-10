import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { obterToken } from '../token-storage';

export interface ContatoChat {
  usuarioId: number;
  nome: string;
  avatar: string;
  foto?: string;
  ultimaMensagem: string;
  ultimaData: Date;
  naoLidas: number;
}

export interface MensagemResposta {
  id: number;
  texto: string;
  audio?: string;
  imagem?: string;
  remetenteNome: string;
}

export interface MensagemVinculo {
  tipo: string;
  id: number;
  titulo: string;
  subtitulo: string;
  link: string;
  icone: string;
}

export interface MensagemChat {
  id: number;
  remetenteId: number;
  remetenteNome: string;
  remetenteFoto?: string;
  destinatarioId: number;
  texto: string;
  lida: boolean;
  entregue: boolean;
  data: Date;
  audio?: string;
  audioDuracao?: number;
  mensagemRespondidaId?: number;
  mensagemRespondida?: MensagemResposta;
  vinculo?: MensagemVinculo;
  imagem?: string;
  imagemNome?: string;
}

export interface MensagemBuscaChat {
  id: number;
  remetenteId: number;
  remetenteNome: string;
  destinatarioId: number;
  texto: string;
  data: Date;
  imagemNome?: string;
  vinculoTitulo?: string;
  contatoId: number;
  contatoNome: string;
  contatoFoto?: string;
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
  readonly resultadosBusca = signal<MensagemBuscaChat[]>([]);

  private typingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private digitandoAtual = new Set<number>();

  getMensagens(usuarioId: number): MensagemChat[] {
    return this._mensagensMap()[usuarioId] || [];
  }

  getStatus(usuarioId: number): StatusUsuario {
    return this.statusMap()[usuarioId] || 'offline';
  }

  private inserirMensagemSeNova(usuarioId: number, msg: MensagemChat): void {
    this._mensagensMap.update(map => {
      const msgs = map[usuarioId] || [];
      if (msgs.some(m => m.id === msg.id)) return map;
      return { ...map, [usuarioId]: [...msgs, msg] };
    });
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
      .withUrl(`/hubs/chat?userId=${userId}`, {
        accessTokenFactory: () => obterToken() ?? '',
      })
      .build();

    this.hubConnection.on('ReceberMensagem', (msg: any) => {
      msg.data = dataDe(msg);
      const ehMinha = msg.remetenteId === userId;
      const outroId = ehMinha ? msg.destinatarioId : msg.remetenteId;
      const resumo = msg.audio ? '[Áudio]' : msg.imagem ? '[Imagem]' : msg.vinculo ? `[${msg.vinculo.tipo === 'colegio' ? 'Escola' : 'Tarefa'}]` : msg.texto;

      this.inserirMensagemSeNova(outroId, {
        ...msg,
        entregue: msg.entregue ?? false,
        lida: msg.lida ?? false,
      } as MensagemChat);

      if (ehMinha) {
        this.contatos.update(lista => lista.map(c =>
          c.usuarioId === outroId ? { ...c, ultimaMensagem: resumo, ultimaData: msg.data } : c));
        return;
      }

      const conversaAberta = this.conversaAtiva() === outroId;

      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});

      this.hubConnection?.invoke('ConfirmarEntrega', msg.id).catch(() => {});

      if (conversaAberta) {
        this.marcarLidas(outroId);
      }

      this.contatos.update(lista => {
        const existe = lista.find(c => c.usuarioId === outroId);
        if (existe) {
          return lista.map(c => c.usuarioId === outroId
            ? { ...c, ultimaMensagem: resumo, ultimaData: msg.data, naoLidas: conversaAberta ? 0 : c.naoLidas + 1 }
            : c);
        }
        return [...lista, {
          usuarioId: outroId, nome: msg.remetenteNome,
          avatar: msg.remetenteNome.charAt(0).toUpperCase(),
          foto: msg.remetenteFoto,
          ultimaMensagem: resumo, ultimaData: msg.data, naoLidas: conversaAberta ? 0 : 1,
        }];
      });
      if (!conversaAberta) this.totalNaoLidas.update(v => v + 1);
    });

    this.hubConnection.on('MensagemEntregue', (mensagemId: number) => {
      this._mensagensMap.update(map => {
        const novo: Record<number, MensagemChat[]> = { ...map };
        for (const key of Object.keys(novo)) {
          const id = Number(key);
          novo[id] = (novo[id] || []).map(m =>
            m.id === mensagemId ? { ...m, entregue: true } : m
          );
        }
        return novo;
      });
    });

    this.hubConnection.on('MensagensLidas', (destinatarioId: number) => {
      this._mensagensMap.update(map => {
        const msgs = (map[destinatarioId] || []).map(m =>
          m.remetenteId === userId ? { ...m, lida: true } : m
        );
        return { ...map, [destinatarioId]: msgs };
      });
    });

    this.hubConnection.on('UsuarioDigitando', (uid: number, digitando: boolean) => {
      this.digitandoMap.update(map => ({ ...map, [uid]: digitando }));
    });

    this.hubConnection.on('UsuarioOnline', (uid: number, status: StatusUsuario) => {
      this.statusMap.update(map => ({ ...map, [uid]: status }));
      if (uid === userId) this.meuStatus.set(status);
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

    this.http.get<any[]>(`/api/Chat/conversas/${meuId}/${usuarioId}?limite=50`).subscribe(msgs => {
      const normalizadas: MensagemChat[] = msgs.map(m => ({ ...m, data: dataDe(m) }));
      this._mensagensMap.update(map => ({ ...map, [usuarioId]: normalizadas }));
    });
  }

  carregarMensagensAntigas(usuarioId: number): Promise<boolean> {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return Promise.resolve(false);

    const atuais = this._mensagensMap()[usuarioId] || [];
    if (atuais.length === 0) return Promise.resolve(false);

    const antesId = atuais[0].id;
    return new Promise(resolve => {
      this.http.get<any[]>(`/api/Chat/conversas/${meuId}/${usuarioId}?antesId=${antesId}&limite=30`).subscribe(msgs => {
        const antigas: MensagemChat[] = msgs.map(m => ({ ...m, data: dataDe(m) }));

        const idsAtuais = new Set(atuais.map(m => m.id));
        const novas = antigas.filter(m => !idsAtuais.has(m.id));

        this._mensagensMap.update(map => ({
          ...map,
          [usuarioId]: [...novas, ...(map[usuarioId] || [])],
        }));

        resolve(antigas.length >= 30);
      });
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

    this.marcarLidas(usuarioId);

    if (!this._mensagensMap()[usuarioId] || this._mensagensMap()[usuarioId].length === 0) {
      this.carregarMensagens(usuarioId);
    }
  }

  private marcarLidas(contatoId: number): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;
    this.http.put(`/api/Chat/lidas/${contatoId}/${userId}`, {}).subscribe();
  }

  fecharConversa(): void {
    this.conversaAtiva.set(null);
  }

  buscarMensagens(termo: string, contatoId?: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId || !termo || termo.trim().length < 2) {
      this.resultadosBusca.set([]);
      return;
    }

    let url = `/api/Chat/buscar/${meuId}?termo=${encodeURIComponent(termo)}`;
    if (contatoId) url += `&contatoId=${contatoId}`;

    this.http.get<any[]>(url).subscribe(rs => {
      this.resultadosBusca.set(rs.map(r => ({ ...r, data: new Date(r.dataCriacao) })));
    });
  }

  enviarMensagem(usuarioId: number, texto: string, mensagemRespondidaId?: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    clearTimeout(this.typingTimers.get(usuarioId));
    this.digitandoAtual.delete(usuarioId);
    this.enviarDigitando(usuarioId, false);

    const dto = { texto, remetenteId: meuId, destinatarioId: usuarioId, mensagemRespondidaId };
    this.http.post<any>('/api/Chat', dto).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemSeNova(usuarioId, msg as MensagemChat);
      this.contatos.update(lista => lista.map(c =>
        c.usuarioId === usuarioId ? { ...c, ultimaMensagem: texto, ultimaData: msg.data } : c));
    });
  }

  enviarAudio(usuarioId: number, blob: Blob, duracao: number, mensagemRespondidaId?: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    form.append('remetenteId', String(meuId));
    form.append('destinatarioId', String(usuarioId));
    form.append('duracao', String(duracao));
    if (mensagemRespondidaId) form.append('mensagemRespondidaId', String(mensagemRespondidaId));

    this.http.post<any>('/api/Chat/audio', form).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemSeNova(usuarioId, msg as MensagemChat);
      this.contatos.update(lista => lista.map(c =>
        c.usuarioId === usuarioId ? { ...c, ultimaMensagem: '[Áudio]', ultimaData: msg.data } : c));
    });
  }

  enviarVinculo(usuarioId: number, vinculo: MensagemVinculo): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const resumo = vinculo.tipo === 'colegio' ? '[Escola]' : '[Tarefa]';
    const dto = { texto: '', remetenteId: meuId, destinatarioId: usuarioId, vinculo };

    this.http.post<any>('/api/Chat', dto).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemSeNova(usuarioId, msg as MensagemChat);
      this.contatos.update(lista => lista.map(c =>
        c.usuarioId === usuarioId ? { ...c, ultimaMensagem: resumo, ultimaData: msg.data } : c));
    });
  }

  enviarImagem(usuarioId: number, blob: Blob, nomeArquivo: string, mensagemRespondidaId?: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const form = new FormData();
    form.append('arquivo', blob, nomeArquivo || 'imagem.png');
    form.append('remetenteId', String(meuId));
    form.append('destinatarioId', String(usuarioId));
    if (mensagemRespondidaId) form.append('mensagemRespondidaId', String(mensagemRespondidaId));

    this.http.post<any>('/api/Chat/imagem', form).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemSeNova(usuarioId, msg as MensagemChat);
      this.contatos.update(lista => lista.map(c =>
        c.usuarioId === usuarioId ? { ...c, ultimaMensagem: '[Imagem]', ultimaData: msg.data } : c));
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

  private cacheUsuarios: { id: number; nome: string; foto?: string }[] | null = null;

  buscarUsuarios(termo: string, excluir?: Set<number>): void {
    const userId = this.auth.usuario()?.id;
    const excl = excluir || new Set();
    if (!userId || !termo || termo.trim().length < 1) {
      this.sugestoesBusca.set([]);
      return;
    }

    const filtrar = (usuarios: { id: number; nome: string; foto?: string }[]) => {
      const t = termo.toLowerCase().trim();
      this.sugestoesBusca.set(
        usuarios
          .filter(u => u.id !== userId && !excl.has(u.id) && u.nome.toLowerCase().includes(t))
          .slice(0, 6)
          .map(u => ({ usuarioId: u.id, nome: u.nome, avatar: u.nome.charAt(0).toUpperCase(), foto: u.foto }))
      );
    };

    if (this.cacheUsuarios) {
      filtrar(this.cacheUsuarios);
      return;
    }

    this.http.get<any[]>('/api/Usuarios').subscribe(usuarios => {
      this.cacheUsuarios = usuarios.map((u: any) => ({ id: u.id, nome: u.nome, foto: u.foto }));
      filtrar(this.cacheUsuarios);
    });
  }

  readonly sugestoesBusca = signal<{ usuarioId: number; nome: string; avatar: string; foto?: string }[]>([]);
}
