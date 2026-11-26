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

export interface GrupoParticipante {
  usuarioId: number;
  nome: string;
  foto?: string;
}

export interface GrupoChatContato {
  grupoId: number;
  criadorId: number;
  nome: string;
  avatar: string;
  ultimaMensagem: string;
  ultimaData: Date;
  naoLidas: number;
  participantes: GrupoParticipante[];
}

export type ConversaAlvo = { tipo: 'direta'; id: number } | { tipo: 'grupo'; id: number };

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
  destinatarioId?: number | null;
  destinatarioNome?: string;
  destinatarioFoto?: string;
  grupoId?: number;
  grupoNome?: string;
  texto: string;
  lida: boolean;
  entregue: boolean;
  lidaPor?: number;
  totalParticipantes?: number;
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
  readonly grupos = signal<GrupoChatContato[]>([]);
  private _mensagensMap = signal<Record<number, MensagemChat[]>>({});
  private _mensagensGrupoMap = signal<Record<number, MensagemChat[]>>({});
  readonly digitandoMap = signal<Record<number, boolean>>({});
  readonly statusMap = signal<Record<number, StatusUsuario>>({});
  readonly meuStatus = signal<StatusUsuario>('online');

  readonly conversaAtiva = signal<ConversaAlvo | null>(null);
  readonly totalNaoLidas = signal(0);
  readonly resultadosBusca = signal<MensagemBuscaChat[]>([]);
  readonly sugestoesBusca = signal<{ usuarioId: number; nome: string; avatar: string; foto?: string }[]>([]);

  private typingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private digitandoAtual = new Set<number>();
  private cacheUsuarios: { id: number; nome: string; foto?: string }[] | null = null;

  getMensagens(usuarioId: number): MensagemChat[] {
    return this._mensagensMap()[usuarioId] || [];
  }

  getMensagensGrupo(grupoId: number): MensagemChat[] {
    return this._mensagensGrupoMap()[grupoId] || [];
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

  private inserirMensagemGrupoSeNova(grupoId: number, msg: MensagemChat): void {
    this._mensagensGrupoMap.update(map => {
      const msgs = map[grupoId] || [];
      if (msgs.some(m => m.id === msg.id)) return map;
      return { ...map, [grupoId]: [...msgs, msg] };
    });
  }

  private upsertContato(contato: ContatoChat): void {
    this.contatos.update(lista => {
      const i = lista.findIndex(c => c.usuarioId === contato.usuarioId);
      if (i === -1) return [contato, ...lista];
      const nova = [...lista];
      nova[i] = contato;
      return nova;
    });
  }

  private recalcularNaoLidas(): void {
    const diretas = this.contatos().reduce((s, c) => s + c.naoLidas, 0);
    const grupos = this.grupos().reduce((s, g) => s + g.naoLidas, 0);
    this.totalNaoLidas.set(diretas + grupos);
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

      for (const c of contatos) {
        if (c.naoLidas > 0 || c.ultimaMensagem) {
          this.carregarMensagens(c.usuarioId);
        }
      }
      this.recalcularNaoLidas();
    });

    this.http.get<any[]>(`/api/Chat/grupos/${userId}`).subscribe(grupos => {
      this.grupos.set(grupos.map(g => ({
        grupoId: g.grupoId,
        criadorId: g.criadorId ?? 0,
        nome: g.nome,
        avatar: (g.nome || 'G').charAt(0).toUpperCase(),
        ultimaMensagem: g.ultimaMensagem,
        ultimaData: g.ultimaData ? new Date(g.ultimaData) : new Date(),
        naoLidas: g.naoLidas,
        participantes: g.participantes || [],
      })));
      this.recalcularNaoLidas();
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
      if (msg.grupoId) {
        this.onMensagemGrupoRecebida(msg, userId);
        return;
      }

      const ehMinha = msg.remetenteId === userId;
      const outroId = ehMinha ? msg.destinatarioId : msg.remetenteId;
      const resumo = msg.audio ? '[Áudio]' : msg.imagem ? '[Imagem]' : msg.vinculo ? `[${msg.vinculo.tipo === 'colegio' ? 'Escola' : 'Tarefa'}]` : msg.texto;

      this.inserirMensagemSeNova(outroId, {
        ...msg,
        entregue: msg.entregue ?? false,
        lida: msg.lida ?? false,
      } as MensagemChat);

      if (ehMinha) {
        this.upsertContato({
          usuarioId: outroId,
          nome: msg.destinatarioNome || `Usuário ${outroId}`,
          avatar: (msg.destinatarioNome || '?').charAt(0).toUpperCase(),
          foto: msg.destinatarioFoto,
          ultimaMensagem: resumo,
          ultimaData: msg.data,
          naoLidas: 0,
        });
        return;
      }

      const conversaAberta = this.conversaAtiva()?.tipo === 'direta' && this.conversaAtiva()?.id === outroId;

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
      if (!conversaAberta) this.recalcularNaoLidas();
    });

    this.hubConnection.on('ReceberGrupo', (g: any) => {
      this.grupos.update(lista => {
        const i = lista.findIndex(x => x.grupoId === g.grupoId);
        const contato: GrupoChatContato = {
          grupoId: g.grupoId,
          criadorId: g.criadorId ?? 0,
          nome: g.nome || 'Grupo',
          avatar: (g.nome || 'G').charAt(0).toUpperCase(),
          ultimaMensagem: g.ultimaMensagem || '',
          ultimaData: g.ultimaData ? new Date(g.ultimaData) : new Date(),
          naoLidas: g.naoLidas ?? 0,
          participantes: g.participantes || [],
        };
        if (i === -1) return [contato, ...lista];
        const nova = [...lista];
        nova[i] = {
          ...nova[i],
          criadorId: contato.criadorId,
          nome: contato.nome,
          avatar: contato.avatar,
          participantes: contato.participantes.length ? contato.participantes : nova[i].participantes,
        };
        return nova;
      });
    });

    this.hubConnection.on('ParticipanteRemovido', (grupoId: number, usuarioId: number) => {
      if (usuarioId === userId) {
        this.grupos.update(lista => lista.filter(g => g.grupoId !== grupoId));
        const alvo = this.conversaAtiva();
        if (alvo?.tipo === 'grupo' && alvo.id === grupoId) {
          this.conversaAtiva.set(null);
        }
        this.recalcularNaoLidas();
      } else {
        this.grupos.update(lista => lista.map(g =>
          g.grupoId === grupoId
            ? { ...g, participantes: g.participantes.filter(p => p.usuarioId !== usuarioId) }
            : g));
        this.carregarMensagensGrupo(grupoId);
      }
    });

    this.hubConnection.on('ParticipanteAdicionado', (grupoId: number, participante: { usuarioId: number; nome: string; foto?: string }) => {
      this.grupos.update(lista => lista.map(g => {
        if (g.grupoId !== grupoId) return g;
        if (g.participantes.some(p => p.usuarioId === participante.usuarioId)) return g;
        return { ...g, participantes: [...g.participantes, participante] };
      }));
      this.carregarMensagensGrupo(grupoId);
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

    this.hubConnection.on('MensagensGrupoLidas', (grupoId: number, usuarioId: number) => {
      if (usuarioId !== userId) {
        this.carregarMensagensGrupo(grupoId);
      }
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

  private onMensagemGrupoRecebida(msg: any, userId: number): void {
    const grupoId = msg.grupoId as number;
    const resumo = msg.audio ? '[Áudio]' : msg.imagem ? '[Imagem]' : msg.vinculo ? `[${msg.vinculo.tipo === 'colegio' ? 'Escola' : 'Tarefa'}]` : msg.texto;
    const ehMinha = msg.remetenteId === userId;
    const alvo = this.conversaAtiva();
    const grupoAberto = alvo?.tipo === 'grupo' && alvo.id === grupoId;

    this.inserirMensagemGrupoSeNova(grupoId, {
      ...msg,
      entregue: msg.entregue ?? false,
      lida: msg.lida ?? false,
    } as MensagemChat);

    this.grupos.update(lista => {
      const existe = lista.find(g => g.grupoId === grupoId);
      if (existe) {
        return lista.map(g => g.grupoId === grupoId
          ? { ...g, ultimaMensagem: resumo, ultimaData: msg.data, naoLidas: ehMinha ? g.naoLidas : (grupoAberto ? 0 : g.naoLidas + 1) }
          : g);
      }
      return [...lista, {
        grupoId,
        criadorId: msg.criadorId ?? 0,
        nome: msg.grupoNome || 'Grupo',
        avatar: (msg.grupoNome || 'G').charAt(0).toUpperCase(),
        ultimaMensagem: resumo,
        ultimaData: msg.data,
        naoLidas: ehMinha ? 0 : (grupoAberto ? 0 : 1),
        participantes: [],
      }];
    });

    if (!ehMinha) {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
      if (grupoAberto) this.marcarGrupoLidas(grupoId);
      this.recalcularNaoLidas();
    }
  }

  carregarMensagens(usuarioId: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    this.http.get<any[]>(`/api/Chat/conversas/${meuId}/${usuarioId}?limite=50`).subscribe(msgs => {
      const normalizadas: MensagemChat[] = msgs.map(m => ({ ...m, data: dataDe(m) }));
      this._mensagensMap.update(map => ({ ...map, [usuarioId]: normalizadas }));
    });
  }

  carregarMensagensGrupo(grupoId: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    this.http.get<any[]>(`/api/Chat/grupo/${meuId}/${grupoId}?limite=50`).subscribe(msgs => {
      const normalizadas: MensagemChat[] = msgs.map(m => ({ ...m, data: dataDe(m) }));
      this._mensagensGrupoMap.update(map => ({ ...map, [grupoId]: normalizadas }));
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

  carregarMensagensAntigasGrupo(grupoId: number): Promise<boolean> {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return Promise.resolve(false);

    const atuais = this._mensagensGrupoMap()[grupoId] || [];
    if (atuais.length === 0) return Promise.resolve(false);

    const antesId = atuais[0].id;
    return new Promise(resolve => {
      this.http.get<any[]>(`/api/Chat/grupo/${meuId}/${grupoId}?antesId=${antesId}&limite=30`).subscribe(msgs => {
        const antigas: MensagemChat[] = msgs.map(m => ({ ...m, data: dataDe(m) }));

        const idsAtuais = new Set(atuais.map(m => m.id));
        const novas = antigas.filter(m => !idsAtuais.has(m.id));

        this._mensagensGrupoMap.update(map => ({
          ...map,
          [grupoId]: [...novas, ...(map[grupoId] || [])],
        }));

        resolve(antigas.length >= 30);
      });
    });
  }

  abrirConversa(usuarioId: number): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;

    this.conversaAtiva.set({ tipo: 'direta', id: usuarioId });

    this.contatos.update(lista => lista.map(c =>
      c.usuarioId === usuarioId ? { ...c, naoLidas: 0 } : c
    ));
    this.recalcularNaoLidas();

    this.marcarLidas(usuarioId);

    if (!this._mensagensMap()[usuarioId] || this._mensagensMap()[usuarioId].length === 0) {
      this.carregarMensagens(usuarioId);
    }
  }

  abrirGrupo(grupoId: number): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;

    this.conversaAtiva.set({ tipo: 'grupo', id: grupoId });

    this.grupos.update(lista => lista.map(g =>
      g.grupoId === grupoId ? { ...g, naoLidas: 0 } : g
    ));
    this.recalcularNaoLidas();

    this.marcarGrupoLidas(grupoId);

    if (!this._mensagensGrupoMap()[grupoId] || this._mensagensGrupoMap()[grupoId].length === 0) {
      this.carregarMensagensGrupo(grupoId);
    }
  }

  private marcarLidas(contatoId: number): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;
    this.http.put(`/api/Chat/lidas/${contatoId}/${userId}`, {}).subscribe();
  }

  private marcarGrupoLidas(grupoId: number): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;
    this.http.put(`/api/Chat/grupo/lidas/${grupoId}/${userId}`, {}).subscribe();
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
      this.upsertContato({
        usuarioId,
        nome: msg.destinatarioNome || `Usuário ${usuarioId}`,
        avatar: (msg.destinatarioNome || '?').charAt(0).toUpperCase(),
        foto: msg.destinatarioFoto,
        ultimaMensagem: texto,
        ultimaData: msg.data,
        naoLidas: 0,
      });
    });
  }

  enviarMensagemGrupo(grupoId: number, texto: string): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const dto = { remetenteId: meuId, texto };
    this.http.post<any>(`/api/Chat/grupo/${grupoId}/mensagem`, dto).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemGrupoSeNova(grupoId, msg as MensagemChat);
      this.grupos.update(lista => lista.map(g =>
        g.grupoId === grupoId ? { ...g, ultimaMensagem: texto, ultimaData: msg.data } : g));
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
      this.upsertContato({
        usuarioId,
        nome: msg.destinatarioNome || `Usuário ${usuarioId}`,
        avatar: (msg.destinatarioNome || '?').charAt(0).toUpperCase(),
        foto: msg.destinatarioFoto,
        ultimaMensagem: '[Áudio]',
        ultimaData: msg.data,
        naoLidas: 0,
      });
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
      this.upsertContato({
        usuarioId,
        nome: msg.destinatarioNome || `Usuário ${usuarioId}`,
        avatar: (msg.destinatarioNome || '?').charAt(0).toUpperCase(),
        foto: msg.destinatarioFoto,
        ultimaMensagem: resumo,
        ultimaData: msg.data,
        naoLidas: 0,
      });
    });
  }

  enviarVinculoGrupo(grupoId: number, vinculo: MensagemVinculo): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const resumo = vinculo.tipo === 'colegio' ? '[Escola]' : '[Tarefa]';
    const dto = { remetenteId: meuId, texto: '', vinculo };

    this.http.post<any>(`/api/Chat/grupo/${grupoId}/mensagem`, dto).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemGrupoSeNova(grupoId, msg as MensagemChat);
      this.grupos.update(lista => lista.map(g =>
        g.grupoId === grupoId ? { ...g, ultimaMensagem: resumo, ultimaData: msg.data } : g));
    });
  }

  enviarAudioGrupo(grupoId: number, blob: Blob, duracao: number): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    form.append('remetenteId', String(meuId));
    form.append('duracao', String(duracao));

    this.http.post<any>(`/api/Chat/grupo/${grupoId}/audio`, form).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemGrupoSeNova(grupoId, msg as MensagemChat);
      this.grupos.update(lista => lista.map(g =>
        g.grupoId === grupoId ? { ...g, ultimaMensagem: '[Áudio]', ultimaData: msg.data } : g));
    });
  }

  enviarImagemGrupo(grupoId: number, blob: Blob, nomeArquivo: string): void {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return;

    const form = new FormData();
    form.append('arquivo', blob, nomeArquivo || 'imagem.png');
    form.append('remetenteId', String(meuId));

    this.http.post<any>(`/api/Chat/grupo/${grupoId}/imagem`, form).subscribe(msg => {
      msg.data = dataDe(msg);
      msg.entregue = msg.entregue ?? false;
      msg.lida = msg.lida ?? false;
      this.inserirMensagemGrupoSeNova(grupoId, msg as MensagemChat);
      this.grupos.update(lista => lista.map(g =>
        g.grupoId === grupoId ? { ...g, ultimaMensagem: '[Imagem]', ultimaData: msg.data } : g));
    });
  }

  criarGrupo(nome: string, participanteIds: number[], texto: string): Promise<number | null> {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return Promise.resolve(null);

    const dto = { remetenteId: meuId, nome, participanteIds, texto };
    return new Promise(resolve => {
      this.http.post<any>('/api/Chat/grupo', dto).subscribe(res => {
        const g = res.grupo;
        if (g) {
          this.grupos.update(lista => {
            const i = lista.findIndex(x => x.grupoId === g.grupoId);
            const contato: GrupoChatContato = {
              grupoId: g.grupoId,
              criadorId: g.criadorId ?? 0,
              nome: g.nome,
              avatar: (g.nome || 'G').charAt(0).toUpperCase(),
              ultimaMensagem: g.ultimaMensagem || '',
              ultimaData: g.ultimaData ? new Date(g.ultimaData) : new Date(),
              naoLidas: 0,
              participantes: g.participantes || [],
            };
            if (i === -1) return [contato, ...lista];
            const nova = [...lista];
            nova[i] = contato;
            return nova;
          });
        }
        resolve(g?.grupoId ?? null);
      });
    });
  }

  removerParticipante(grupoId: number, usuarioId: number): Promise<boolean> {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return Promise.resolve(false);

    return new Promise(resolve => {
      this.http.delete(`/api/Chat/grupo/${grupoId}/participante/${usuarioId}?solicitanteId=${meuId}`).subscribe({
        next: () => {
          this.grupos.update(lista => lista.map(g =>
            g.grupoId === grupoId
              ? { ...g, participantes: g.participantes.filter(p => p.usuarioId !== usuarioId) }
              : g));
          this.carregarMensagensGrupo(grupoId);
          resolve(true);
        },
        error: () => resolve(false),
      });
    });
  }

  adicionarParticipante(grupoId: number, usuarioId: number): Promise<boolean> {
    const meuId = this.auth.usuario()?.id;
    if (!meuId) return Promise.resolve(false);

    return new Promise(resolve => {
      this.http.post(`/api/Chat/grupo/${grupoId}/participante`, { solicitanteId: meuId, usuarioId }).subscribe({
        next: () => resolve(true),
        error: () => resolve(false),
      });
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
      this.upsertContato({
        usuarioId,
        nome: msg.destinatarioNome || `Usuário ${usuarioId}`,
        avatar: (msg.destinatarioNome || '?').charAt(0).toUpperCase(),
        foto: msg.destinatarioFoto,
        ultimaMensagem: '[Imagem]',
        ultimaData: msg.data,
        naoLidas: 0,
      });
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
}
