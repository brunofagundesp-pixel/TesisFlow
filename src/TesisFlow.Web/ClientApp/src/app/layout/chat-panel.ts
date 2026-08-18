import { Component, Output, EventEmitter, OnInit, OnDestroy, HostListener, signal, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/services/auth.service';
import { ChatService, ContatoChat, MensagemChat, MensagemVinculo } from '../core/services/chat.service';
import { CallService } from '../core/services/call.service';
import { ChatAnexarTarefaDialogComponent } from '../shared/chat-anexar-tarefa-dialog';
import { ChatLightboxDialogComponent } from '../shared/chat-lightbox-dialog';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatTooltipModule, DatePipe, TextFieldModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
})
export class ChatPanelComponent implements OnInit, OnDestroy {
  @Output() fechar = new EventEmitter<void>();
  @ViewChild('mensagensContainer') mensagensContainer?: ElementRef<HTMLElement>;

  novaMensagem = '';
  termoBusca = '';
  termoBuscaGrupo = '';
  mostrarLigacaoGrupo = false;
  participantesGrupo = new Set<number>();

  respondendoA: MensagemChat | null = null;
  carregandoAntigas = false;

  gravando = false;
  tempoGravacao = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private gravacaoTimer: any;
  private velocidades = new Map<number, number>();
  private audioEstado = signal<Record<number, { tocando: boolean; tempoAtual: number; duracao: number }>>({});
  private audioAtual: HTMLAudioElement | null = null;

  constructor(
    public chatService: ChatService,
    public callService: CallService,
    public auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.callService.inicializar();
  }

  ngOnDestroy(): void {
    this.cancelarGravacao();
  }

  get meuId(): number {
    return this.auth.usuario()?.id ?? 0;
  }

  get contatoAtivo(): ContatoChat | undefined {
    const id = this.chatService.conversaAtiva();
    if (!id) return undefined;
    return this.chatService.contatos().find(c => c.usuarioId === id);
  }

  get mensagensAtivas(): MensagemChat[] {
    const id = this.chatService.conversaAtiva();
    if (!id) return [];
    return this.chatService.getMensagens(id);
  }

  get digitandoAtivo(): boolean {
    const id = this.chatService.conversaAtiva();
    if (!id) return false;
    return this.chatService.digitandoMap()[id] || false;
  }

  statusMensagem(mensagem: MensagemChat): string {
    if (mensagem.lida) return 'Lida';
    if (mensagem.entregue) return 'Entregue';
    return 'Enviada';
  }

  dataSeparador(index: number): string | null {
    const msgs = this.mensagensAtivas;
    const m = msgs[index];
    if (!m) return null;

    const anterior = msgs[index - 1];
    if (!anterior) return this.formatarData(m.data);

    return this.mesmoDia(m.data, anterior.data) ? null : this.formatarData(m.data);
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private formatarData(d: Date): string {
    const hoje = new Date();
    if (this.mesmoDia(d, hoje)) return 'Hoje';

    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (this.mesmoDia(d, ontem)) return 'Ontem';

    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  abrirConversa(id: number): void {
    this.chatService.abrirConversa(id);
  }

  voltar(): void {
    this.chatService.fecharConversa();
  }

  enviar(): void {
    const texto = this.novaMensagem.trim();
    const id = this.chatService.conversaAtiva();
    if (!texto || !id) return;
    this.chatService.enviarMensagem(id, texto, this.respondendoA?.id);
    this.novaMensagem = '';
    this.cancelarResposta();
  }

  responder(m: MensagemChat): void {
    this.respondendoA = m;
  }

  cancelarResposta(): void {
    this.respondendoA = null;
  }

  anexarTarefa(): void {
    const id = this.chatService.conversaAtiva();
    if (!id) return;

    const dialogRef = this.dialog.open(ChatAnexarTarefaDialogComponent, {
      width: '400px',
      maxWidth: '92vw',
      data: { usuarioId: this.meuId },
    });

    dialogRef.afterClosed().subscribe((vinculo: MensagemVinculo | undefined) => {
      if (vinculo) this.chatService.enviarVinculo(id, vinculo);
    });
  }

  abrirVinculo(vinculo: MensagemVinculo): void {
    if (vinculo?.link) this.router.navigateByUrl(vinculo.link);
  }

  abrirImagem(m: MensagemChat): void {
    if (!m.imagem) return;
    this.dialog.open(ChatLightboxDialogComponent, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'chat-lightbox-panel',
      data: { src: m.imagem, nome: m.imagemNome || '' },
    });
  }

  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    let imagem: File | null = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        imagem = item.getAsFile();
        break;
      }
    }

    if (!imagem) return;

    const id = this.chatService.conversaAtiva();
    if (!id) return;

    event.preventDefault();
    this.chatService.enviarImagem(id, imagem, imagem.name || `imagem-${Date.now()}.png`, this.respondendoA?.id);
    this.cancelarResposta();
  }

  resumoRespondida(m: MensagemChat): string {
    return m.audio ? '[Áudio]' : m.texto;
  }

  rolarParaMensagem(id: number): void {
    this.rolarEHighlight(id, 0);
  }

  private rolarEHighlight(id: number, tentativa: number): void {
    const container = this.mensagensContainer?.nativeElement;
    if (!container) return;

    const el = container.querySelector(`#msg-${id}`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('chat-msg--destacada');
      setTimeout(() => el.classList.remove('chat-msg--destacada'), 2200);
      return;
    }

    const ativo = this.chatService.conversaAtiva();
    if (!ativo || tentativa >= 6) return;

    this.chatService.carregarMensagensAntigas(ativo).then(temMais => {
      if (temMais) setTimeout(() => this.rolarEHighlight(id, tentativa + 1), 350);
    });
  }

  onScrollMensagens(): void {
    const el = this.mensagensContainer?.nativeElement;
    if (!el || this.carregandoAntigas) return;
    if (el.scrollTop <= 30) this.carregarAntigas();
  }

  private async carregarAntigas(): Promise<void> {
    const id = this.chatService.conversaAtiva();
    const el = this.mensagensContainer?.nativeElement;
    if (!id || !el || this.carregandoAntigas) return;

    this.carregandoAntigas = true;
    const alturaAntes = el.scrollHeight;

    try {
      const temMais = await this.chatService.carregarMensagensAntigas(id);
      if (temMais) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - alturaAntes;
        });
      }
    } finally {
      this.carregandoAntigas = false;
    }
  }

  async iniciarGravacao(): Promise<void> {
    if (this.gravando) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => this.finalizarGravacao();
      this.mediaRecorder.start();
      this.tempoGravacao = 0;
      this.gravando = true;
      this.gravacaoTimer = setInterval(() => {
        this.tempoGravacao++;
        if (this.tempoGravacao >= 300) this.pararGravacao();
      }, 1000);
    } catch {
      this.gravando = false;
    }
  }

  pararGravacao(): void {
    if (!this.gravando || !this.mediaRecorder) return;
    this.mediaRecorder.stop();
  }

  cancelarGravacao(): void {
    this.gravando = false;
    this.audioChunks = [];
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    if (this.gravacaoTimer) clearInterval(this.gravacaoTimer);
    this.tempoGravacao = 0;
    this.pararStream();
  }

  private finalizarGravacao(): void {
    const duracao = this.tempoGravacao;
    this.gravando = false;
    if (this.gravacaoTimer) clearInterval(this.gravacaoTimer);
    this.tempoGravacao = 0;
    this.pararStream();

    const id = this.chatService.conversaAtiva();
    if (!id || this.audioChunks.length === 0 || duracao < 1) {
      this.audioChunks = [];
      return;
    }

    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    this.audioChunks = [];
    this.chatService.enviarAudio(id, blob, duracao, this.respondendoA?.id);
    this.cancelarResposta();
  }

  private pararStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  get tempoGravacaoFormatado(): string {
    const mins = Math.floor(this.tempoGravacao / 60).toString().padStart(2, '0');
    const secs = (this.tempoGravacao % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  velocidade(m: MensagemChat): number {
    return this.velocidades.get(m.id) || 1;
  }

  rotuloVelocidade(m: MensagemChat): string {
    return `${this.velocidade(m)}x`;
  }

  alternarVelocidade(m: MensagemChat, player: HTMLAudioElement): void {
    const atual = this.velocidade(m);
    const proxima = atual === 1 ? 1.5 : atual === 1.5 ? 2.5 : 1;
    this.velocidades.set(m.id, proxima);
    player.playbackRate = proxima;
  }

  private estadoDe(m: MensagemChat): { tocando: boolean; tempoAtual: number; duracao: number } {
    return this.audioEstado()[m.id] || { tocando: false, tempoAtual: 0, duracao: m.audioDuracao || 0 };
  }

  estaTocando(m: MensagemChat): boolean {
    return this.estadoDe(m).tocando;
  }

  alternarPlay(m: MensagemChat, player: HTMLAudioElement): void {
    if (player.paused) {
      if (this.audioAtual && this.audioAtual !== player) this.audioAtual.pause();
      this.audioAtual = player;
      player.play().catch(() => {});
    } else {
      player.pause();
    }
  }

  aoPlay(m: MensagemChat): void {
    this.atualizarEstado(m, { tocando: true });
  }

  aoPause(m: MensagemChat): void {
    this.atualizarEstado(m, { tocando: false });
  }

  aoEnded(m: MensagemChat): void {
    this.atualizarEstado(m, { tocando: false, tempoAtual: 0 });
  }

  aoCarregarMetadata(m: MensagemChat, player: HTMLAudioElement): void {
    if (isFinite(player.duration)) this.atualizarEstado(m, { duracao: player.duration });
  }

  aoAtualizarTempo(m: MensagemChat, player: HTMLAudioElement): void {
    this.atualizarEstado(m, { tempoAtual: player.currentTime });
  }

  private atualizarEstado(m: MensagemChat, patch: Partial<{ tocando: boolean; tempoAtual: number; duracao: number }>): void {
    this.audioEstado.update(map => {
      const atual = map[m.id] || { tocando: false, tempoAtual: 0, duracao: m.audioDuracao || 0 };
      return { ...map, [m.id]: { ...atual, ...patch } };
    });
  }

  tempoAtualAudio(m: MensagemChat): string {
    return this.formatarTempo(this.estadoDe(m).tempoAtual);
  }

  duracaoTotalAudio(m: MensagemChat): string {
    return this.formatarTempo(this.estadoDe(m).duracao);
  }

  progressoAudio(m: MensagemChat): number {
    const e = this.estadoDe(m);
    if (!e.duracao) return 0;
    return Math.min(100, (e.tempoAtual / e.duracao) * 100);
  }

  buscarNoAudio(event: MouseEvent, m: MensagemChat, player: HTMLAudioElement): void {
    const barra = event.currentTarget as HTMLElement;
    const rect = barra.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const duracao = player.duration || this.estadoDe(m).duracao;
    if (duracao) {
      player.currentTime = ratio * duracao;
      this.atualizarEstado(m, { tempoAtual: ratio * duracao });
    }
  }

  private formatarTempo(seg: number): string {
    if (!isFinite(seg) || seg < 0) seg = 0;
    const s = Math.floor(seg);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  ligar(): void {
    const contato = this.contatoAtivo;
    if (!contato) return;
    this.callService.criarChamadaGrupo([{ id: contato.usuarioId, nome: contato.nome }]);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }

  onInput(): void {
    const id = this.chatService.conversaAtiva();
    if (id) this.chatService.onInputDigitando(id);
  }

  private buscaTimer: any;

  onBuscaChange(termo: string): void {
    this.termoBusca = termo;
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => this.chatService.buscarUsuarios(termo), 150);
  }

  toggleParticipante(id: number): void {
    if (this.participantesGrupo.has(id)) {
      this.participantesGrupo.delete(id);
    } else if (this.participantesGrupo.size < 6) {
      this.participantesGrupo.add(id);
    }
  }

  participanteIds(): number[] {
    return Array.from(this.participantesGrupo);
  }

  participanteNome(id: number): string {
    return this.chatService.contatos().find(c => c.usuarioId === id)?.nome || `Usuário ${id}`;
  }

  onBuscaGrupo(): void {
    if (!this.termoBuscaGrupo || this.termoBuscaGrupo.trim().length < 1) {
      this.chatService.sugestoesBusca.set([]);
      return;
    }
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => this.chatService.buscarUsuarios(this.termoBuscaGrupo, this.participantesGrupo), 150);
  }

  iniciarLigacaoGrupo(): void {
    if (this.participantesGrupo.size === 0) return;
    const destinos = Array.from(this.participantesGrupo).map(id => ({ id, nome: this.participanteNome(id) }));
    this.callService.criarChamadaGrupo(destinos);
    this.mostrarLigacaoGrupo = false;
    this.participantesGrupo.clear();
  }

  @HostListener('document:click', ['$event'])
  fecharDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.chat-busca') || target.closest('.chat-grupo-search-wrapper') || target.closest('.call-busca')) return;
    this.chatService.sugestoesBusca.set([]);
  }
}
