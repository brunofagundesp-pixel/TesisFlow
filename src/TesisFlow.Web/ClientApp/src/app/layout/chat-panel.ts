import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DatePipe } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ChatService, ContatoChat, MensagemChat } from '../core/services/chat.service';
import { CallService } from '../core/services/call.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [FormsModule, MatIconModule, DatePipe, TextFieldModule],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.scss',
})
export class ChatPanelComponent implements OnInit {
  @Output() fechar = new EventEmitter<void>();

  novaMensagem = '';
  termoBusca = '';
  termoBuscaGrupo = '';
  mostrarLigacaoGrupo = false;
  participantesGrupo = new Set<number>();

  constructor(
    public chatService: ChatService,
    public callService: CallService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.callService.inicializar();
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
    this.chatService.enviarMensagem(id, texto);
    this.novaMensagem = '';
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
