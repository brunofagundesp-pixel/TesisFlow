import { Component, Output, EventEmitter, OnInit, OnDestroy, HostListener, signal, ViewChild, ElementRef, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../core/services/auth.service';
import { AuthUrlPipe, comToken } from '../core/auth-url';
import { ChatService, ContatoChat, GrupoChatContato, GrupoParticipante, MensagemChat, MensagemVinculo, MensagemBuscaChat } from '../core/services/chat.service';
import { CallService } from '../core/services/call.service';
import { ChatAnexarTarefaDialogComponent } from '../shared/chat-anexar-tarefa-dialog';
import { ChatLightboxDialogComponent } from '../shared/chat-lightbox-dialog';
import { ConfirmarSimplesDialogComponent } from '../shared/confirmar-simples-dialog';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatTooltipModule, DatePipe, TextFieldModule, AuthUrlPipe],
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

  mostrarNovoGrupo = false;
  nomeNovoGrupo = '';
  novaMensagemGrupo = '';
  termoBuscaNovoGrupo = '';
  participantesNovoGrupo = new Map<number, { nome: string; foto?: string }>();

  mostrarDetalhesGrupo = false;
  termoBuscaAdicionar = '';

  respondendoA: MensagemChat | null = null;
  carregandoAntigas = false;
  mostrarRolarAbaixo = false;
  buscando = false;
  termoBuscaMensagem = '';

  gravando = false;
  tempoGravacao = 0;
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private gravacaoTimer: any;
  private velocidades = new Map<number, number>();
  private audioEstado = signal<Record<number, { tocando: boolean; tempoAtual: number; duracao: number }>>({});
  private audioAtual: HTMLAudioElement | null = null;

  private ultimaConversa: string | null = null;
  private ultimaContagem = -1;

  constructor(
    public chatService: ChatService,
    public callService: CallService,
    public auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
  ) {
    effect(() => {
      const a = this.chatService.conversaAtiva();
      const key = a ? `${a.tipo}:${a.id}` : null;
      const count = this.mensagensAtivas.length;

      if (!key) {
        this.ultimaConversa = null;
        this.ultimaContagem = -1;
        return;
      }

      if (key !== this.ultimaConversa) {
        this.ultimaConversa = key;
        this.ultimaContagem = count;
        this.agendarRolagemParaFinal();
        return;
      }

      if (count !== this.ultimaContagem) {
        this.ultimaContagem = count;
        const el = this.mensagensContainer?.nativeElement;
        if (!el) {
          this.agendarRolagemParaFinal();
          return;
        }
        const pertoDoFinal = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
        if (pertoDoFinal) this.agendarRolagemParaFinal();
      }
    });
  }

  ngOnInit(): void {
    this.callService.inicializar();
  }

  ngOnDestroy(): void {
    this.cancelarGravacao();
  }

  get meuId(): number {
    return this.auth.usuario()?.id ?? 0;
  }

  get ehGrupo(): boolean {
    return this.chatService.conversaAtiva()?.tipo === 'grupo';
  }

  get contatoAtivo(): ContatoChat | undefined {
    const a = this.chatService.conversaAtiva();
    if (!a || a.tipo !== 'direta') return undefined;
    return this.chatService.contatos().find(c => c.usuarioId === a.id);
  }

  get grupoAtivo(): GrupoChatContato | undefined {
    const a = this.chatService.conversaAtiva();
    if (!a || a.tipo !== 'grupo') return undefined;
    return this.chatService.grupos().find(g => g.grupoId === a.id);
  }

  get mensagensAtivas(): MensagemChat[] {
    const a = this.chatService.conversaAtiva();
    if (!a) return [];
    return a.tipo === 'grupo' ? this.chatService.getMensagensGrupo(a.id) : this.chatService.getMensagens(a.id);
  }

  get digitandoAtivo(): boolean {
    const a = this.chatService.conversaAtiva();
    if (!a || a.tipo !== 'direta') return false;
    return this.chatService.digitandoMap()[a.id] || false;
  }

  get nomesParticipantes(): string {
    const g = this.grupoAtivo;
    if (!g) return '';
    return g.participantes.map(p => p.nome).join(', ');
  }

  get ehCriador(): boolean {
    return this.grupoAtivo?.criadorId === this.meuId;
  }

  statusMensagem(mensagem: MensagemChat): string {
    if (mensagem.lida) return 'Lida';
    if (mensagem.entregue) return 'Entregue';
    return 'Enviada';
  }

  statusGrupo(mensagem: MensagemChat): string {
    if (mensagem.totalParticipantes != null && mensagem.lidaPor != null) {
      return `Lida por ${mensagem.lidaPor} de ${mensagem.totalParticipantes}`;
    }
    return 'Entregue';
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

  formatarDataContato(data: Date): string {
    if (!data) return '';

    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const dataDia = new Date(data.getFullYear(), data.getMonth(), data.getDate());

    const diffDias = Math.round((inicioHoje.getTime() - dataDia.getTime()) / 86400000);

    if (diffDias <= 0) {
      return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    if (diffDias === 1) return 'Ontem';

    if (diffDias < 7) {
      const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
      return dias[dataDia.getDay()];
    }

    return dataDia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  abrirConversa(id: number): void {
    this.mostrarRolarAbaixo = false;
    this.mostrarDetalhesGrupo = false;
    this.fecharBusca();
    this.chatService.abrirConversa(id);
  }

  abrirGrupo(id: number): void {
    this.mostrarRolarAbaixo = false;
    this.mostrarDetalhesGrupo = false;
    this.fecharBusca();
    this.chatService.abrirGrupo(id);
  }

  abrirDetalhesGrupo(): void {
    this.fecharBusca();
    this.mostrarDetalhesGrupo = true;
    this.termoBuscaAdicionar = '';
    this.chatService.sugestoesBusca.set([]);
  }

  voltar(): void {
    if (this.mostrarDetalhesGrupo) {
      this.mostrarDetalhesGrupo = false;
      this.termoBuscaAdicionar = '';
      this.chatService.sugestoesBusca.set([]);
      return;
    }
    this.mostrarRolarAbaixo = false;
    this.fecharBusca();
    this.chatService.fecharConversa();
  }

  fecharPainel(): void {
    this.mostrarRolarAbaixo = false;
    this.fecharBusca();
    this.cancelarResposta();
    this.mostrarLigacaoGrupo = false;
    this.participantesGrupo.clear();
    this.mostrarNovoGrupo = false;
    this.nomeNovoGrupo = '';
    this.novaMensagemGrupo = '';
    this.participantesNovoGrupo.clear();
    this.mostrarDetalhesGrupo = false;
    this.termoBuscaAdicionar = '';
    this.termoBusca = '';
    this.termoBuscaGrupo = '';
    this.termoBuscaNovoGrupo = '';
    this.chatService.fecharConversa();
    this.fechar.emit();
  }

  enviar(): void {
    const texto = this.novaMensagem.trim();
    const a = this.chatService.conversaAtiva();
    if (!texto || !a) return;
    if (a.tipo === 'grupo') {
      this.chatService.enviarMensagemGrupo(a.id, texto);
    } else {
      this.chatService.enviarMensagem(a.id, texto, this.respondendoA?.id);
    }
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
    const a = this.chatService.conversaAtiva();
    if (!a) return;

    const dialogRef = this.dialog.open(ChatAnexarTarefaDialogComponent, {
      width: '400px',
      maxWidth: '92vw',
      data: { usuarioId: this.meuId },
    });

    dialogRef.afterClosed().subscribe((vinculo: MensagemVinculo | undefined) => {
      if (!vinculo) return;
      if (this.ehGrupo) {
        this.chatService.enviarVinculoGrupo(a.id, vinculo);
      } else {
        this.chatService.enviarVinculo(a.id, vinculo);
      }
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
      data: { src: comToken(m.imagem), nome: m.imagemNome || '' },
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

    const a = this.chatService.conversaAtiva();
    if (!a) return;

    event.preventDefault();
    const nome = imagem.name || `imagem-${Date.now()}.png`;
    if (a.tipo === 'grupo') {
      this.chatService.enviarImagemGrupo(a.id, imagem, nome);
    } else {
      this.chatService.enviarImagem(a.id, imagem, nome, this.respondendoA?.id);
    }
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

    const carregar = ativo.tipo === 'grupo'
      ? this.chatService.carregarMensagensAntigasGrupo(ativo.id)
      : this.chatService.carregarMensagensAntigas(ativo.id);

    carregar.then(temMais => {
      if (temMais) setTimeout(() => this.rolarEHighlight(id, tentativa + 1), 350);
    });
  }

  onScrollMensagens(): void {
    const el = this.mensagensContainer?.nativeElement;
    if (!el || this.carregandoAntigas) return;
    this.mostrarRolarAbaixo = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
    if (el.scrollTop <= 30) this.carregarAntigas();
  }

  rolarParaBaixo(): void {
    const el = this.mensagensContainer?.nativeElement;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    this.mostrarRolarAbaixo = false;
  }

  private agendarRolagemParaFinal(): void {
    requestAnimationFrame(() => {
      const el = this.mensagensContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }

  alternarBusca(): void {
    this.buscando = !this.buscando;
    if (!this.buscando) this.fecharBusca();
  }

  fecharBusca(): void {
    this.buscando = false;
    this.termoBuscaMensagem = '';
    clearTimeout(this.buscaMensagemTimer);
    this.chatService.resultadosBusca.set([]);
  }

  onBuscaMensagem(termo: string): void {
    this.termoBuscaMensagem = termo;
    clearTimeout(this.buscaMensagemTimer);
    if (!termo || termo.trim().length < 2) {
      this.chatService.resultadosBusca.set([]);
      return;
    }
    this.buscaMensagemTimer = setTimeout(() => {
      const a = this.chatService.conversaAtiva();
      const contatoId = a && a.tipo === 'direta' ? a.id : undefined;
      this.chatService.buscarMensagens(termo, contatoId);
    }, 150);
  }

  irParaResultado(r: MensagemBuscaChat): void {
    const ativa = this.chatService.conversaAtiva();
    if (ativa && ativa.tipo === 'direta' && ativa.id === r.contatoId) {
      this.rolarParaMensagem(r.id);
    } else {
      this.abrirConversa(r.contatoId);
      setTimeout(() => this.rolarParaMensagem(r.id), 350);
    }
  }

  private async carregarAntigas(): Promise<void> {
    const a = this.chatService.conversaAtiva();
    const el = this.mensagensContainer?.nativeElement;
    if (!a || !el || this.carregandoAntigas) return;

    this.carregandoAntigas = true;
    const alturaAntes = el.scrollHeight;

    try {
      const temMais = a.tipo === 'grupo'
        ? await this.chatService.carregarMensagensAntigasGrupo(a.id)
        : await this.chatService.carregarMensagensAntigas(a.id);
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

    const a = this.chatService.conversaAtiva();
    if (!a || this.audioChunks.length === 0 || duracao < 1) {
      this.audioChunks = [];
      return;
    }

    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    this.audioChunks = [];
    if (a.tipo === 'grupo') {
      this.chatService.enviarAudioGrupo(a.id, blob, duracao);
    } else {
      this.chatService.enviarAudio(a.id, blob, duracao, this.respondendoA?.id);
    }
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
    const a = this.chatService.conversaAtiva();
    if (a && a.tipo === 'direta') this.chatService.onInputDigitando(a.id);
  }

  private buscaTimer: any;
  private buscaMensagemTimer: any;

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

  toggleNovoGrupo(): void {
    this.mostrarNovoGrupo = !this.mostrarNovoGrupo;
    if (this.mostrarNovoGrupo) this.mostrarLigacaoGrupo = false;
    this.termoBuscaNovoGrupo = '';
    this.chatService.sugestoesBusca.set([]);
  }

  onBuscaNovoGrupo(): void {
    if (!this.termoBuscaNovoGrupo || this.termoBuscaNovoGrupo.trim().length < 1) {
      this.chatService.sugestoesBusca.set([]);
      return;
    }
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => {
      const excluir = new Set(this.participantesNovoGrupo.keys());
      this.chatService.buscarUsuarios(this.termoBuscaNovoGrupo, excluir);
    }, 150);
  }

  toggleParticipanteNovoGrupo(u: { usuarioId: number; nome: string; foto?: string }): void {
    if (this.participantesNovoGrupo.has(u.usuarioId)) {
      this.participantesNovoGrupo.delete(u.usuarioId);
    } else if (this.participantesNovoGrupo.size < 20) {
      this.participantesNovoGrupo.set(u.usuarioId, { nome: u.nome, foto: u.foto });
    }
  }

  participantesNovoGrupoLista(): { usuarioId: number; nome: string; foto?: string }[] {
    return Array.from(this.participantesNovoGrupo.entries())
      .map(([usuarioId, v]) => ({ usuarioId, nome: v.nome, foto: v.foto }));
  }

  criarNovoGrupo(): void {
    if (this.participantesNovoGrupo.size === 0) return;
    const ids = Array.from(this.participantesNovoGrupo.keys());
    const nomes = Array.from(this.participantesNovoGrupo.values()).map(v => v.nome);
    const nome = this.nomeNovoGrupo.trim() || (nomes.slice(0, 3).join(', ') + (nomes.length > 3 ? '...' : ''));
    const texto = this.novaMensagemGrupo.trim();

    this.chatService.criarGrupo(nome, ids, texto).then(grupoId => {
      this.mostrarNovoGrupo = false;
      this.nomeNovoGrupo = '';
      this.novaMensagemGrupo = '';
      this.termoBuscaNovoGrupo = '';
      this.participantesNovoGrupo.clear();
      if (grupoId) this.abrirGrupo(grupoId);
    });
  }

  onBuscaAdicionar(): void {
    if (!this.termoBuscaAdicionar || this.termoBuscaAdicionar.trim().length < 1) {
      this.chatService.sugestoesBusca.set([]);
      return;
    }
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => {
      const excluir = new Set((this.grupoAtivo?.participantes ?? []).map(p => p.usuarioId));
      this.chatService.buscarUsuarios(this.termoBuscaAdicionar, excluir);
    }, 150);
  }

  adicionarParticipante(u: { usuarioId: number; nome: string; foto?: string }): void {
    const grupo = this.grupoAtivo;
    if (!grupo) return;
    this.chatService.adicionarParticipante(grupo.grupoId, u.usuarioId).then(ok => {
      if (ok) {
        this.termoBuscaAdicionar = '';
        this.chatService.sugestoesBusca.set([]);
      }
    });
  }

  removerParticipante(p: GrupoParticipante): void {
    const grupo = this.grupoAtivo;
    if (!grupo) return;

    const dialogRef = this.dialog.open(ConfirmarSimplesDialogComponent, {
      width: '400px',
      maxWidth: '92vw',
      data: {
        titulo: 'Remover participante',
        mensagem: `Remover ${p.nome} do grupo?`,
        textoBotao: 'Remover',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.chatService.removerParticipante(grupo.grupoId, p.usuarioId);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  fecharDropdowns(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.chat-busca') || target.closest('.chat-grupo-search-wrapper') || target.closest('.chat-detalhes-adicionar') || target.closest('.call-busca')) return;
    this.chatService.sugestoesBusca.set([]);
  }
}
