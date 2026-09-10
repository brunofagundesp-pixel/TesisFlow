import { Injectable, signal, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { obterToken } from '../token-storage';

interface Participant {
  userId: number;
  nome: string;
  status: 'conectando' | 'conectado' | 'semResposta' | 'recusou' | 'ocupado';
}

interface CallState {
  status: 'idle' | 'chamando' | 'recebendo' | 'emAndamento';
  roomId: string;
  participants: Participant[];
  duracao: string;
  mutado: boolean;
  compartilhandoTela: boolean;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

@Injectable({ providedIn: 'root' })
export class CallService {
  private auth = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;
  private peerConnections = new Map<number, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private timerInterval: any;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private participantTimeouts = new Map<number, any>();

  readonly callState = signal<CallState>({ status: 'idle', roomId: '', participants: [], duracao: '00:00', mutado: false, compartilhandoTela: false });
  readonly mostrarModal = signal(false);
  readonly minimizado = signal(false);
  readonly remoteVideos = signal<{ userId: number; stream: MediaStream }[]>([]);
  readonly screenPreview = signal<MediaStream | null>(null);
  readonly avisoOcupados = signal<{ id: number; nome: string }[]>([]);

  private pendingOffers = new Map<number, RTCSessionDescriptionInit>();
  private pendingCandidates = new Map<number, RTCIceCandidateInit[]>();

  inicializar(): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;
    this.conectarSignalR(userId);
  }

  private async invocar<T>(method: string, ...args: any[]): Promise<T | undefined> {
    const conn = this.hubConnection;
    if (!conn || conn.state !== signalR.HubConnectionState.Connected) {
      return undefined;
    }
    try {
      return await conn.invoke<T>(method, ...args);
    } catch {
      return undefined;
    }
  }

  private conectarSignalR(userId: number): void {
    if (this.hubConnection) return;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/chamadas?userId=${userId}`, {
        accessTokenFactory: () => obterToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ChamadaGrupoRecebida', (roomId: string, iniciadorId: number, iniciadorNome: string, participants: any[]) => {
      const meuNome = this.auth.usuario()?.nome || '';
      const parts: Participant[] = participants.map((p: any) => ({
        userId: p.id,
        nome: p.id === iniciadorId ? iniciadorNome : (p.id === userId ? meuNome : (p.nome || `Usuário ${p.id}`)),
        status: 'conectando' as const,
      }));
      this.callState.set({ status: 'recebendo', roomId, participants: parts, duracao: '00:00', mutado: false, compartilhandoTela: false });
      this.minimizado.set(false);
      this.avisoOcupados.set([]);
      this.mostrarModal.set(true);
      this.ringtoneAudio = new Audio('/sounds/ringtone.mp3');
      this.ringtoneAudio.loop = true;
      this.ringtoneAudio.volume = 0.6;
      this.ringtoneAudio.play().catch(() => {});
    });

    this.hubConnection.on('OfertaGrupoRecebida', async (roomId: string, senderId: number, oferta: string) => {
      let pc = this.peerConnections.get(senderId);
      if (!pc) {
        await this.criarPeerConnection(senderId);
        pc = this.peerConnections.get(senderId);
      }
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(oferta)));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.invocar('EnviarRespostaGrupo', roomId, senderId, JSON.stringify(answer));
      } catch { /* ignora renegociação concorrente */ }
    });

    this.hubConnection.on('RespostaGrupoRecebida', async (roomId: string, senderId: number, resposta: string) => {
      const pc = this.peerConnections.get(senderId);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(resposta)));
    });

    this.hubConnection.on('CandidatoICEGrupoRecebido', async (roomId: string, senderId: number, candidato: string) => {
      const pc = this.peerConnections.get(senderId);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(candidato)));
      } else {
        const arr = this.pendingCandidates.get(senderId) || [];
        arr.push(JSON.parse(candidato));
        this.pendingCandidates.set(senderId, arr);
      }
    });

    this.hubConnection.on('ParticipanteEntrou', async (roomId: string, userId: number, nome: string) => {
      this.callState.update(s => {
        if (s.roomId !== roomId) return s;
        if (s.participants.find(p => p.userId === userId)) return s;
        return { ...s, participants: [...s.participants, { userId, nome: nome || `Usuário ${userId}`, status: 'conectando' }] };
      });
      await this.conectarComParticipante(roomId, userId);
      this.iniciarTimeoutParticipante(userId);
    });

    this.hubConnection.on('ParticipanteSaiu', (roomId: string, userId: number) => {
      this.fecharConexaoParticipante(userId);
      this.callState.update(s => ({
        ...s,
        participants: s.participants.filter(p => p.userId !== userId),
      }));
    });

    this.hubConnection.on('ParticipanteOcupado', (userId: number, nome: string) => {
      this.avisoOcupados.update(arr => {
        if (arr.some(o => o.id === userId)) return arr;
        return [...arr, { id: userId, nome: nome || `Usuário ${userId}` }];
      });
    });

    this.hubConnection.on('SalaEncerrada', (roomId: string) => {
      this.limparChamada();
    });

    this.hubConnection.start().catch(err => console.warn('Call SignalR erro:', err));
  }

  async criarChamadaGrupo(destinos: { id: number; nome: string }[]): Promise<void> {
    const meuId = this.auth.usuario()?.id;
    const meuNome = this.auth.usuario()?.nome || 'Usuário';
    if (!meuId) return;

    const me: Participant = { userId: meuId, nome: meuNome, status: 'conectado' };
    const others: Participant[] = destinos.map(d => ({ userId: d.id, nome: d.nome, status: 'conectando' as const }));
    const destIds = destinos.map(d => d.id);

    this.callState.set({ status: 'chamando', roomId: '', participants: [me, ...others], duracao: '00:00', mutado: false, compartilhandoTela: false });
    this.mostrarModal.set(true);
    this.callState.update(s => ({ ...s, status: 'emAndamento' }));

    try {
      await this.criarLocalStream();
    } catch {
      this.limparChamada();
      return;
    }

    const resultado = await this.invocar<any>('CriarSalaGrupo', destIds, meuNome);
    if (!resultado?.roomId) {
      const ocupados: { id: number; nome: string }[] = resultado?.ocupados || [];
      if (ocupados.length === 0) {
        this.limparChamada();
        return;
      }
      this.avisoOcupados.set(ocupados);
      this.callState.set({ status: 'idle', roomId: '', participants: [], duracao: '00:00', mutado: false, compartilhandoTela: false });
      this.mostrarModal.set(true);
      return;
    }

    const roomId: string = resultado.roomId;
    const ocupados: { id: number; nome: string }[] = resultado.ocupados || [];

    if (ocupados.length > 0) {
      this.avisoOcupados.set(ocupados);
      this.callState.update(s => ({
        ...s,
        participants: s.participants.map(p =>
          ocupados.some(o => o.id === p.userId) ? { ...p, status: 'ocupado' as const } : p),
      }));
    }

    this.invocar('EntrarSalaGrupo', roomId);
    this.callState.update(s => ({ ...s, roomId }));
    this.iniciarTimer();

    const disponiveis = destIds.filter(id => !ocupados.some(o => o.id === id));
    for (const id of disponiveis) {
      await this.conectarComParticipante(roomId, id);
      this.iniciarTimeoutParticipante(id);
    }
  }

  async aceitarChamadaGrupo(): Promise<void> {
    this.pararRingtone();
    const roomId = this.callState().roomId;
    const meuId = this.auth.usuario()?.id;
    if (!roomId || !meuId) return;

    this.invocar('EntrarSalaGrupo', roomId);
    this.callState.update(s => ({ ...s, status: 'emAndamento' }));
    await this.criarLocalStream();
    this.iniciarTimer();

    const others = this.callState().participants.filter(p => p.userId !== meuId);
    for (const p of others) {
      await this.conectarComParticipante(roomId, p.userId);
      this.iniciarTimeoutParticipante(p.userId);
    }
  }

  recusarChamada(): void {
    this.pararRingtone();
    this.enviarSairSala();
    this.limparChamada();
  }

  minimizar(): void {
    this.minimizado.set(true);
  }

  maximizar(): void {
    this.minimizado.set(false);
  }

  alternarMinimizado(): void {
    this.minimizado.update(v => !v);
  }

  encerrarChamada(): void {
    this.pararRingtone();
    const roomId = this.callState().roomId;
    if (roomId) this.invocar('EncerrarSala', roomId);
    this.limparChamada();
  }

  adicionarParticipante(userId: number): void {
    const roomId = this.callState().roomId;
    if (!roomId) return;
    this.callState.update(s => ({
      ...s,
      participants: [...s.participants, { userId, nome: `Usuário ${userId}`, status: 'conectando' as const }],
    }));
    this.invocar<boolean>('AdicionarParticipanteSala', roomId, userId).then(adicionado => {
      if (!adicionado) {
        this.callState.update(s => ({
          ...s,
          participants: s.participants.map(p => p.userId === userId ? { ...p, status: 'ocupado' as const } : p),
        }));
        return;
      }
      this.conectarComParticipante(roomId, userId);
      this.iniciarTimeoutParticipante(userId);
    });
  }

  limparAviso(): void {
    this.avisoOcupados.set([]);
    this.callState.set({ status: 'idle', roomId: '', participants: [], duracao: '00:00', mutado: false, compartilhandoTela: false });
    this.minimizado.set(false);
    this.mostrarModal.set(false);
  }

  mutar(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.callState.update(s => ({ ...s, mutado: !s.mutado }));
      }
    }
  }

  async compartilharTela(): Promise<void> {
    if (this.screenStream) return;

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      this.screenStream = null;
      return;
    }

    const videoTrack = this.screenStream.getVideoTracks()[0];
    if (!videoTrack) {
      this.pararCompartilhamento();
      return;
    }

    videoTrack.onended = () => this.pararCompartilhamento();

    for (const pc of this.peerConnections.values()) {
      pc.addTrack(videoTrack, this.screenStream);
    }

    this.screenPreview.set(this.screenStream);
    this.callState.update(s => ({ ...s, compartilhandoTela: true }));

    for (const userId of Array.from(this.peerConnections.keys())) {
      await this.renegociarPc(userId);
    }
  }

  pararCompartilhamento(): void {
    const screen = this.screenStream;
    if (!screen) return;

    for (const pc of this.peerConnections.values()) {
      for (const sender of pc.getSenders()) {
        if (sender.track && sender.track.kind === 'video') {
          try { pc.removeTrack(sender); } catch { /* ignora */ }
        }
      }
    }

    screen.getTracks().forEach(t => t.stop());
    this.screenStream = null;
    this.screenPreview.set(null);
    this.callState.update(s => ({ ...s, compartilhandoTela: false }));

    for (const userId of Array.from(this.peerConnections.keys())) {
      this.renegociarPc(userId);
    }
  }

  private async renegociarPc(userId: number): Promise<void> {
    const pc = this.peerConnections.get(userId);
    const roomId = this.callState().roomId;
    if (!pc || !roomId) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.invocar('EnviarOfertaGrupo', roomId, userId, JSON.stringify(offer));
    } catch { /* ignora renegociação concorrente */ }
  }

  private async conectarComParticipante(roomId: string, userId: number): Promise<void> {
    await this.criarPeerConnection(userId);
    const pc = this.peerConnections.get(userId)!;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.hubConnection?.invoke('EnviarOfertaGrupo', roomId, userId, JSON.stringify(offer));
  }

  private async criarPeerConnection(userId: number): Promise<void> {
    this.fecharConexaoParticipante(userId);
    if (!this.localStream) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(userId, pc);

    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream);
    }

    if (this.screenStream) {
      for (const track of this.screenStream.getTracks()) {
        pc.addTrack(track, this.screenStream);
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;

      if (event.track.kind === 'video') {
        event.track.onended = () => {
          this.remoteVideos.update(videos => videos.filter(v => v.userId !== userId));
        };
        this.remoteVideos.update(videos => {
          if (videos.some(v => v.userId === userId)) {
            return videos.map(v => v.userId === userId ? { ...v, stream } : v);
          }
          return [...videos, { userId, stream }];
        });
      } else {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const roomId = this.callState().roomId;
        this.invocar('EnviarCandidatoICEGrupo', roomId, userId, JSON.stringify(event.candidate));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        clearTimeout(this.participantTimeouts.get(userId));
        this.callState.update(s => ({
          ...s,
          participants: s.participants.map(p => p.userId === userId ? { ...p, status: 'conectado' as const } : p),
        }));
      }
    };

    const pending = this.pendingCandidates.get(userId) || [];
    this.pendingCandidates.delete(userId);
  }

  private fecharConexaoParticipante(userId: number): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.remoteVideos.update(videos => videos.filter(v => v.userId !== userId));
  }

  private async criarLocalStream(): Promise<void> {
    if (this.localStream) return;
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  private iniciarTimer(): void {
    let segundos = 0;
    this.timerInterval = setInterval(() => {
      segundos++;
      const mins = Math.floor(segundos / 60).toString().padStart(2, '0');
      const secs = (segundos % 60).toString().padStart(2, '0');
      this.callState.update(s => ({ ...s, duracao: `${mins}:${secs}` }));
    }, 1000);
  }

  private enviarSairSala(): void {
    const roomId = this.callState().roomId;
    if (roomId) this.invocar('SairSalaGrupo', roomId);
  }

  private iniciarTimeoutParticipante(userId: number): void {
    clearTimeout(this.participantTimeouts.get(userId));
    this.participantTimeouts.set(userId, setTimeout(() => {
      this.callState.update(s => ({
        ...s,
        participants: s.participants.map(p => p.userId === userId && p.status === 'conectando' ? { ...p, status: 'semResposta' } : p),
      }));
    }, 30000));
  }

  private limparChamada(): void {
    this.pararRingtone();
    clearInterval(this.timerInterval);
    for (const t of this.participantTimeouts.values()) clearTimeout(t);
    this.participantTimeouts.clear();
    for (const key of this.peerConnections.keys()) {
      this.fecharConexaoParticipante(key);
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    this.screenPreview.set(null);
    this.remoteVideos.set([]);
    this.avisoOcupados.set([]);
    this.callState.set({ status: 'idle', roomId: '', participants: [], duracao: '00:00', mutado: false, compartilhandoTela: false });
    this.minimizado.set(false);
    this.mostrarModal.set(false);
  }

  private pararRingtone(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio = null;
    }
  }
}
