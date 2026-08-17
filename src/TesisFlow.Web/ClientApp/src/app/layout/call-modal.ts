import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CallService } from '../core/services/call.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    @if (callService.mostrarModal()) {
      <div class="call-overlay">
        <div class="call-modal">
          <div class="call-title">
            <mat-icon>groups</mat-icon>
            Chamada em grupo
          </div>

          <div class="call-participants">
            @for (p of callService.callState().participants; track p.userId) {
              <div class="call-pcard" [class.pcard-conectado]="p.status === 'conectado'" [class.pcard-conectando]="p.status === 'conectando'" [class.pcard-semresp]="p.status === 'semResposta'" [class.pcard-recusou]="p.status === 'recusou'">
                <div class="pcard-avatar">{{ p.nome ? p.nome.charAt(0) : '?' }}</div>
                <span class="pcard-nome">{{ p.nome || 'Usuário ' + p.userId }}</span>
                <span class="pcard-status">
                  @if (p.status === 'conectado') {
                    <span class="pcard-dot dot-verde"></span> Conectado
                  } @else if (p.status === 'conectando') {
                    <span class="pcard-dot dot-amarelo"></span> Conectando...
                  } @else if (p.status === 'semResposta') {
                    <span class="pcard-dot dot-vermelho"></span> Sem resposta
                  } @else if (p.status === 'recusou') {
                    <span class="pcard-dot dot-vermelho"></span> Recusou
                  }
                </span>
              </div>
            }
          </div>

          <div class="call-timer">
            <span class="timer-dot"></span>
            @if (callService.callState().status === 'chamando') {
              <span class="timer-text">Chamando...</span>
            } @else if (callService.callState().status === 'recebendo') {
              <span class="timer-text">Recebendo chamada...</span>
            } @else {
              <span class="timer-text">{{ callService.callState().duracao }}</span>
            }
          </div>

          @if (callService.callState().status === 'emAndamento' && !mostrarBusca) {
            <button class="call-add-btn" (click)="mostrarBusca = true">
              <mat-icon>person_add</mat-icon> Adicionar pessoa
            </button>
          }

          @if (mostrarBusca && callService.callState().status === 'emAndamento') {
            <div class="call-busca">
              <input class="call-busca-input" placeholder="Buscar usuario..." [(ngModel)]="termoBusca" (input)="buscar()" />
              @if (sugestoes.length > 0) {
                <div class="call-busca-list">
                  @for (u of sugestoes; track u.id) {
                    <div class="call-busca-item" (click)="adicionar(u.id, u.nome); mostrarBusca = false">
                      <span class="call-busca-avatar">{{ u.nome.charAt(0) }}</span>
                      <span>{{ u.nome }}</span>
                    </div>
                  }
                </div>
              }
              <button class="call-busca-fechar" (click)="mostrarBusca = false">Cancelar</button>
            </div>
          }

          <div class="call-actions">
            @if (callService.callState().status === 'recebendo') {
              <button class="call-action call-accept" (click)="callService.aceitarChamadaGrupo()">
                <mat-icon>call</mat-icon>
              </button>
              <button class="call-action call-reject" (click)="callService.recusarChamada()">
                <mat-icon>call_end</mat-icon>
              </button>
            } @else if (callService.callState().status === 'chamando') {
              <button class="call-action call-reject" (click)="callService.encerrarChamada()">
                <mat-icon>call_end</mat-icon>
              </button>
            } @else if (callService.callState().status === 'emAndamento') {
              <button class="call-action call-mute" [class.call-mute--active]="callService.callState().mutado" (click)="callService.mutar()">
                <mat-icon>{{ callService.callState().mutado ? 'mic_off' : 'mic' }}</mat-icon>
              </button>
              <button class="call-action call-reject" (click)="callService.encerrarChamada()">
                <mat-icon>call_end</mat-icon>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes pulse-verde {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
    }
    @keyframes pulse-amarelo {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .call-overlay {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(15, 23, 42, 0.6);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
    }
    .call-modal {
      background: var(--tf-surface); border-radius: 24px;
      padding: 2.5rem 2rem 2rem;
      text-align: center;
      box-shadow: 0 25px 80px rgba(0,0,0,0.25);
      min-width: 380px; max-width: 480px;
    }
    .call-title {
      display: flex; align-items: center; justify-content: center;
      gap: 0.5rem; font-size: 0.9rem; font-weight: 600;
      color: var(--tf-text-muted); margin-bottom: 1.5rem;
      text-transform: uppercase; letter-spacing: 0.05em;
      mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; }
    }

    .call-participants {
      display: flex; justify-content: center; gap: 1rem;
      flex-wrap: wrap; margin-bottom: 1.25rem;
    }
    .call-pcard {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.25rem; padding: 0.75rem 0.5rem; border-radius: 14px;
      min-width: 88px; border: 2px solid transparent;
      transition: border-color 0.3s;
    }
    .pcard-conectado { border-color: var(--tf-success); background: var(--tf-success-bg); }
    .pcard-conectando { border-color: var(--tf-warning); background: var(--tf-warning-bg); }
    .pcard-semresp { border-color: var(--tf-danger); background: var(--tf-danger-bg); }
    .pcard-recusou { border-color: var(--tf-danger); background: var(--tf-danger-bg); }

    .pcard-avatar {
      width: 52px; height: 52px; border-radius: 16px;
      background: var(--tf-primary-light); color: var(--tf-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.3rem; margin-bottom: 0.15rem;
    }
    .pcard-nome {
      font-size: 0.78rem; font-weight: 600; color: var(--tf-text-primary);
      max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .pcard-status {
      font-size: 0.68rem; font-weight: 600; color: var(--tf-text-muted);
      display: flex; align-items: center; gap: 0.3rem;
    }
    .pcard-dot {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .dot-verde { background: var(--tf-success); }
    .dot-amarelo { background: var(--tf-warning); animation: pulse-amarelo 1.2s infinite; }
    .dot-vermelho { background: var(--tf-danger); }

    .call-timer {
      display: flex; align-items: center; justify-content: center;
      gap: 0.5rem; margin: 0.75rem 0 1.25rem;
    }
    .timer-dot {
      width: 10px; height: 10px; border-radius: 50%; background: var(--tf-success);
      animation: pulse-verde 2s infinite;
    }
    .timer-text {
      font-size: 1.5rem; font-weight: 700; color: var(--tf-text-primary);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }

    .call-add-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 1rem; border-radius: 10px;
      background: var(--tf-surface-soft); color: var(--tf-text-body);
      border: 1px solid var(--tf-border); cursor: pointer;
      font-size: 0.82rem; font-family: inherit; margin-bottom: 1rem;
      transition: background 0.1s;
      &:hover { background: var(--tf-surface-hover); }
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .call-busca { margin-bottom: 1rem; text-align: left; }
    .call-busca-input {
      width: 100%; padding: 0.4rem 0.75rem;
      border: 1.5px solid var(--tf-border-input); border-radius: 10px;
      font-size: 0.82rem; font-family: inherit; outline: none;
      &:focus { border-color: var(--tf-primary); }
    }
    .call-busca-list {
      background: var(--tf-surface); border: 1px solid var(--tf-border);
      border-radius: 10px; max-height: 160px; overflow-y: auto; margin-top: 0.25rem;
    }
    .call-busca-item {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 0.75rem; cursor: pointer; font-size: 0.82rem;
      &:hover { background: var(--tf-surface-soft); }
    }
    .call-busca-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--tf-primary-light); color: var(--tf-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.7rem; flex-shrink: 0;
    }
    .call-busca-fechar {
      display: block; margin-top: 0.5rem; background: none; border: none;
      color: var(--tf-text-muted); cursor: pointer; font-size: 0.78rem;
      font-family: inherit; padding: 0;
      &:hover { color: var(--tf-text-body); }
    }

    .call-actions { display: flex; justify-content: center; gap: 1.5rem; }
    .call-action {
      width: 56px; height: 56px; border-radius: 50%; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
      &:hover { transform: scale(1.15); }
      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; color: #fff; }
    }
    .call-accept { background: var(--tf-success); }
    .call-reject { background: var(--tf-danger); }
    .call-mute { background: var(--tf-text-muted); }
    .call-mute--active { background: var(--tf-danger); }
  `],
})
export class CallModalComponent {
  callService = inject(CallService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  mostrarBusca = false;
  termoBusca = '';
  sugestoes: { id: number; nome: string }[] = [];

  buscar(): void {
    const t = this.termoBusca.trim().toLowerCase();
    const meuId = this.auth.usuario()?.id;
    if (!t || t.length < 1) { this.sugestoes = []; return; }

    this.http.get<any[]>('/api/Usuarios').subscribe(usuarios => {
      this.sugestoes = usuarios
        .filter((u: any) => u.id !== meuId && u.nome.toLowerCase().includes(t) && !this.callService.callState().participants.find(p => p.userId === u.id))
        .slice(0, 6)
        .map((u: any) => ({ id: u.id, nome: u.nome }));
    });
  }

  adicionar(id: number, nome: string): void {
    this.callService.adicionarParticipante(id);
    this.termoBusca = '';
    this.sugestoes = [];
  }
}
