import { Injectable, signal, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

interface Participant {
  userId: number;
  nome: string;
  status: 'conectando' | 'conectado' | 'semResposta' | 'recusou';
}

interface CallState {
  status: 'idle' | 'chamando' | 'recebendo' | 'emAndamento';
  roomId: string;
  participants: Participant[];
  duracao: string;
  mutado: boolean;
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
  private timerInterval: any;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private participantTimeouts = new Map<number, any>();

  readonly callState = signal<CallState>({ status: 'idle', roomId: '', participants: [], duracao: '00:00', mutado: false });
  readonly mostrarModal = signal(false);

  private pendingOffers = new Map<number, RTCSessionDescriptionInit>();
  private pendingCandidates = new Map<number, RTCIceCandidateInit[]>();

  inicializar(): void {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;
    this.conectarSignalR(userId);
  }

  private conectarSignalR(userId: number): void {
    if (this.hubConnection) return;
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`/hubs/chamadas?userId=${userId}`)
      .build();

    this.hubConnection.on('ChamadaGrupoRecebida', (roomId: string, iniciadorId: number, iniciadorNome: string, participants: any[]) => {
      const parts: Participant[] = participants.map((p: any) => ({
        userId: p.id,
        nome: p.id === iniciadorId ? iniciadorNome : (p.nome || `Usuário ${p.id}`),
        status: 'conectando' as const,
      }));
      this.callState.set({ status: 'recebendo', roomId, participants: parts, duracao: '00:00', mutado: false });
      this.mostrarModal.set(true);
      this.ringtoneAudio = new Audio('/sounds/ringtone.mp3');
      this.ringtoneAudio.loop = true;
      this.ringtoneAudio.volume = 0.6;
      this.ringtoneAudio.play().catch(() => {});
    });

    this.hubConnection.on('OfertaGrupoRecebida', async (roomId: string, senderId: number, oferta: string) => {
      await this.criarPeerConnection(senderId);
      const pc = this.peerConnections.get(senderId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(oferta)));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.hubConnection?.invoke('EnviarRespostaGrupo', roomId, senderId, JSON.stringify(answer));
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

    this.callState.set({ status: 'chamando', roomId: '', participants: [me, ...others], duracao: '00:00', mutado: false });
    this.mostrarModal.set(true);
    this.callState.update(s => ({ ...s, status: 'emAndamento' }));

    await this.criarLocalStream();
    const roomId = await this.hubConnection!.invoke<string>('CriarSalaGrupo', destIds, meuNome) || '';
    if (!roomId) return;

    this.hubConnection?.invoke('EntrarSalaGrupo', roomId);
    this.callState.update(s => ({ ...s, roomId }));
    this.iniciarTimer();

    for (const id of destIds) {
      await this.conectarComParticipante(roomId, id);
      this.iniciarTimeoutParticipante(id);
    }
  }

  async aceitarChamadaGrupo(): Promise<void> {
    this.pararRingtone();
    const roomId = this.callState().roomId;
    const meuId = this.auth.usuario()?.id;
    if (!roomId || !meuId) return;

    this.hubConnection?.invoke('EntrarSalaGrupo', roomId);
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

  encerrarChamada(): void {
    this.pararRingtone();
    const roomId = this.callState().roomId;
    if (roomId) this.hubConnection?.invoke('EncerrarSala', roomId);
    this.limparChamada();
  }

  adicionarParticipante(userId: number): void {
    const roomId = this.callState().roomId;
    if (!roomId) return;
    this.callState.update(s => ({
      ...s,
      participants: [...s.participants, { userId, nome: `Usuário ${userId}`, status: 'conectando' as const }],
    }));
    this.hubConnection?.invoke('AdicionarParticipanteSala', roomId, userId).then(() => {
      this.conectarComParticipante(roomId, userId);
      this.iniciarTimeoutParticipante(userId);
    });
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

    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const roomId = this.callState().roomId;
        this.hubConnection?.invoke('EnviarCandidatoICEGrupo', roomId, userId, JSON.stringify(event.candidate));
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
    if (roomId) this.hubConnection?.invoke('SairSalaGrupo', roomId);
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
    this.callState.set({ status: 'idle', roomId: '', participants: [], duracao: '00:00', mutado: false });
    this.mostrarModal.set(false);
  }

  private pararRingtone(): void {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio = null;
    }
  }
}
