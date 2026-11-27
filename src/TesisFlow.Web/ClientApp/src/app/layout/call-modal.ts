import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { CallService } from '../core/services/call.service';
import { AuthService } from '../core/services/auth.service';
import { normalizarTexto } from '../core/utils/texto.util';

@Component({
  selector: 'app-call-modal',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    @if (callService.mostrarModal()) {
      @if (callService.minimizado() && callService.callState().status === 'emAndamento') {
        <div class="call-float">
          <div class="call-float-info" (click)="callService.maximizar()">
            <div class="call-float-avatares">
              @for (p of callService.callState().participants; track p.userId) {
                <span class="call-float-avatar" [title]="p.nome">{{ p.nome ? p.nome.charAt(0) : '?' }}</span>
              }
            </div>
            <div class="call-float-meta">
              <span class="call-float-duracao">{{ callService.callState().duracao }}</span>
              <span class="call-float-dot"></span>
            </div>
          </div>
          <div class="call-float-actions">
            <button class="call-float-btn" [class.ativo]="callService.callState().mutado" (click)="callService.mutar()" title="Mutar">
              <mat-icon>{{ callService.callState().mutado ? 'mic_off' : 'mic' }}</mat-icon>
            </button>
            <button class="call-float-btn" [class.ativo]="callService.callState().compartilhandoTela" (click)="alternarTela()" title="Compartilhar tela">
              <mat-icon>{{ callService.callState().compartilhandoTela ? 'stop_screen_share' : 'screen_share' }}</mat-icon>
            </button>
            <button class="call-float-btn call-float-btn--danger" (click)="callService.encerrarChamada()" title="Encerrar">
              <mat-icon>call_end</mat-icon>
            </button>
          </div>
        </div>
      } @else {
        <div class="call-overlay">
          @if (callService.callState().status === 'emAndamento') {
            <div class="call-modal call-room" [class.call-modal--video]="videoAtivo()">
              <div class="call-header">
                <div class="call-title">
                  <mat-icon>groups</mat-icon>
                  Chamada em grupo
                </div>
                <button class="call-header-min" (click)="callService.minimizar()" title="Minimizar">
                  <mat-icon>remove</mat-icon>
                </button>
              </div>
              @if (callService.avisoOcupados().length > 0) {
                <div class="call-aviso">
                  <mat-icon>info</mat-icon>
                  <span>{{ nomesOcupados() }} está em outra ligação</span>
                </div>
              }
              <div class="call-body">
                <aside class="call-sidebar">
                  <div class="call-participants call-participants--lista">
                    @for (p of callService.callState().participants; track p.userId) {
                      <div class="call-pcard call-pcard--lista" [class.pcard-conectado]="p.status === 'conectado'" [class.pcard-conectando]="p.status === 'conectando'" [class.pcard-semresp]="p.status === 'semResposta'" [class.pcard-recusou]="p.status === 'recusou'" [class.pcard-ocupado]="p.status === 'ocupado'">
                        <div class="pcard-avatar">{{ p.nome ? p.nome.charAt(0) : '?' }}</div>
                        <div class="pcard-info">
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
                            } @else if (p.status === 'ocupado') {
                              <span class="pcard-dot dot-cinza"></span> Ocupado
                            }
                          </span>
                        </div>
                      </div>
                    }
                  </div>

                  @if (!mostrarBusca) {
                    <button class="call-add-btn" (click)="mostrarBusca = true">
                      <mat-icon>person_add</mat-icon> Adicionar pessoa
                    </button>
                  }

                  @if (mostrarBusca) {
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
                </aside>

                <section class="call-stage">
                  @if (videoAtivo()) {
                    <div class="call-videos">
                      @for (v of callService.remoteVideos(); track v.userId) {
                        <div class="call-video-wrapper">
                          <video autoplay playsinline [srcObject]="v.stream"></video>
                          <span class="call-video-label">{{ participanteNome(v.userId) }}</span>
                        </div>
                      }
                      @if (callService.screenPreview()) {
                        <div class="call-video-pip">
                          <video autoplay playsinline muted [srcObject]="callService.screenPreview()"></video>
                          <span class="call-video-label">Sua tela</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="call-stage-vazio">
                      <div class="call-stage-icone"><mat-icon>call</mat-icon></div>
                      <span class="call-stage-texto">Chamada de voz</span>
                    </div>
                  }
                </section>
              </div>

              <div class="call-footer">
                <div class="call-timer">
                  <span class="timer-dot"></span>
                  <span class="timer-text">{{ callService.callState().duracao }}</span>
                </div>
                <div class="call-actions">
                  <button class="call-action call-mute" [class.call-mute--active]="callService.callState().mutado" (click)="callService.mutar()">
                    <mat-icon>{{ callService.callState().mutado ? 'mic_off' : 'mic' }}</mat-icon>
                  </button>
                  <button class="call-action call-share" [class.call-share--active]="callService.callState().compartilhandoTela" (click)="alternarTela()">
                    <mat-icon>{{ callService.callState().compartilhandoTela ? 'stop_screen_share' : 'screen_share' }}</mat-icon>
                  </button>
                  <button class="call-action call-reject" (click)="callService.encerrarChamada()">
                    <mat-icon>call_end</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          } @else if (callService.avisoOcupados().length > 0) {
            <div class="call-modal">
              <div class="call-title">
                <mat-icon>phone_disabled</mat-icon>
                Chamada indisponível
              </div>
              <p class="aviso-texto">
                {{ nomesOcupados() }} está em outra ligação
              </p>
              <div class="call-actions">
                <button class="call-action call-reject" (click)="callService.limparAviso()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          } @else {
            <div class="call-modal">
              <div class="call-title">
                <mat-icon>groups</mat-icon>
                Chamada em grupo
              </div>

              <div class="call-participants">
                @for (p of callService.callState().participants; track p.userId) {
                  <div class="call-pcard" [class.pcard-conectado]="p.status === 'conectado'" [class.pcard-conectando]="p.status === 'conectando'" [class.pcard-semresp]="p.status === 'semResposta'" [class.pcard-recusou]="p.status === 'recusou'" [class.pcard-ocupado]="p.status === 'ocupado'">
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
                      } @else if (p.status === 'ocupado') {
                        <span class="pcard-dot dot-cinza"></span> Ocupado
                      }
                    </span>
                  </div>
                }
              </div>

              <div class="call-timer">
                <span class="timer-dot"></span>
                @if (callService.callState().status === 'chamando') {
                  <span class="timer-text">Chamando...</span>
                } @else {
                  <span class="timer-text">Recebendo chamada...</span>
                }
              </div>

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
                }
              </div>
            </div>
          }
        </div>
      }
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

    .call-room {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      background: var(--tf-surface);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 80px rgba(0,0,0,0.25);
      text-align: left;
      width: min(98vw, 1440px);
      max-width: none;
      min-width: 0;
      height: 94vh;
      height: 94dvh;
      max-height: 94vh;
      max-height: 94dvh;
      transition: width 0.2s, height 0.2s;
    }

    .call-room.call-modal--video {
      position: fixed; inset: 0;
      width: auto; height: auto;
      max-width: none; max-height: none;
      border-radius: 0;
    }

    .call-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .call-header {
      display: flex; align-items: center; justify-content: space-between;
      gap: 0.75rem;
      padding: 0.6rem 0.9rem;
      border-bottom: 1px solid var(--tf-border);
      background: var(--tf-surface);
      flex-shrink: 0;
    }
    .call-header .call-title { margin-bottom: 0; justify-content: flex-start; }
    .call-header-min {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px; border-radius: 8px;
      border: none; background: none; cursor: pointer;
      color: var(--tf-text-muted);
      &:hover { background: var(--tf-surface-hover); color: var(--tf-text-body); }
      mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; }
    }

    .call-aviso {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.9rem;
      background: var(--tf-warning-bg);
      border-bottom: 1px solid var(--tf-border);
      color: var(--tf-warning);
      font-size: 0.82rem; font-weight: 600;
      flex-shrink: 0;
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .aviso-texto {
      font-size: 0.9rem; color: var(--tf-text-body);
      margin: 0 0 1.5rem;
    }

    .call-sidebar {
      width: 280px; flex-shrink: 0;
      display: flex; flex-direction: column;
      padding: 1rem 0.75rem;
      border-right: 1px solid var(--tf-border);
      background: var(--tf-surface-soft);
      overflow-y: auto;
      min-height: 0;
    }

    .call-stage {
      flex: 1; min-width: 0; min-height: 0;
      display: flex; flex-direction: column;
      position: relative;
      background: #0b0f1a;
    }

    .call-videos {
      flex: 1; min-height: 0;
      position: relative;
      display: flex;
      align-items: stretch;
    }

    .call-video-wrapper {
      flex: 1 1 auto;
      min-width: 0; min-height: 0;
      position: relative;
      video { display: block; width: 100%; height: 100%; object-fit: contain; }
    }

    .call-video-pip {
      position: absolute; right: 0.75rem; bottom: 0.75rem;
      width: 240px; height: 150px;
      border-radius: 10px; overflow: hidden;
      border: 2px solid rgba(255,255,255,0.25);
      background: #000;
      z-index: 2;
      video { display: block; width: 100%; height: 100%; object-fit: contain; }
    }

    .call-video-label {
      position: absolute; left: 0.4rem; bottom: 0.4rem;
      font-size: 0.68rem; font-weight: 600; color: #fff;
      background: rgba(0,0,0,0.5); padding: 0.1rem 0.4rem;
      border-radius: 6px;
    }

    .call-stage-vazio {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.75rem;
    }
    .call-stage-icone {
      width: 84px; height: 84px; border-radius: 50%;
      background: rgba(255,255,255,0.08);
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 2.4rem; width: 2.4rem; height: 2.4rem; color: rgba(255,255,255,0.85); }
    }
    .call-stage-texto {
      font-size: 0.9rem; font-weight: 600; color: rgba(255,255,255,0.7);
    }

    .call-footer {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding: 0.75rem 1rem;
      background: var(--tf-surface);
      border-top: 1px solid var(--tf-border);
      flex-shrink: 0;
    }

    .call-title {
      display: flex; align-items: center; justify-content: center;
      gap: 0.5rem; font-size: 0.9rem; font-weight: 600;
      color: var(--tf-text-muted); margin-bottom: 1.5rem;
      text-transform: uppercase; letter-spacing: 0.05em;
      text-align: center;
      mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; }
    }

    .call-participants {      display: flex; justify-content: center; gap: 1rem;
      flex-wrap: wrap; margin-bottom: 1.25rem;
    }
    .call-participants--lista {
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .call-pcard {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.25rem; padding: 0.75rem 0.5rem; border-radius: 14px;
      min-width: 88px; border: 2px solid transparent;
      transition: border-color 0.3s;
    }
    .call-pcard--lista {
      flex-direction: row;
      align-items: center;
      gap: 0.6rem;
      min-width: 0;
      padding: 0.5rem 0.6rem;
      border-radius: 12px;
      text-align: left;
    }
    .pcard-conectado { border-color: var(--tf-success); background: var(--tf-success-bg); }
    .pcard-conectando { border-color: var(--tf-warning); background: var(--tf-warning-bg); }
    .pcard-semresp { border-color: var(--tf-danger); background: var(--tf-danger-bg); }
    .pcard-recusou { border-color: var(--tf-danger); background: var(--tf-danger-bg); }
    .pcard-ocupado { border-color: var(--tf-text-faint); background: var(--tf-surface-hover); }

    .pcard-avatar {
      width: 52px; height: 52px; border-radius: 16px;
      background: var(--tf-primary-light); color: var(--tf-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.3rem; margin-bottom: 0.15rem;
      flex-shrink: 0;
    }
    .call-pcard--lista .pcard-avatar {
      width: 40px; height: 40px; border-radius: 10px;
      font-size: 1rem; margin-bottom: 0;
    }
    .pcard-info {
      display: flex; flex-direction: column;
      min-width: 0;
    }
    .pcard-nome {
      font-size: 0.78rem; font-weight: 600; color: var(--tf-text-primary);
      max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .call-pcard--lista .pcard-nome { max-width: none; }
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
    .dot-cinza { background: var(--tf-text-faint); }

    .call-timer {
      display: flex; align-items: center; justify-content: center;
      gap: 0.5rem; margin: 0.75rem 0 1.25rem;
    }
    .call-footer .call-timer { margin: 0; }
    .timer-dot {
      width: 10px; height: 10px; border-radius: 50%; background: var(--tf-success);
      animation: pulse-verde 2s infinite;
    }
    .timer-text {
      font-size: 1.5rem; font-weight: 700; color: var(--tf-text-primary);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }
    .call-footer .timer-text { font-size: 1.1rem; }

    .call-add-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 1rem; border-radius: 10px;
      background: var(--tf-surface); color: var(--tf-text-body);
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
      box-sizing: border-box;
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

    .call-actions { display: flex; justify-content: center; gap: 1rem; flex-wrap: nowrap; }
    .call-action {
      width: 56px; height: 56px; border-radius: 50%; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform 0.15s;
      &:hover { transform: scale(1.15); }
      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; color: #fff; }
    }
    .call-footer .call-action { width: 46px; height: 46px; mat-icon { font-size: 1.25rem; width: 1.25rem; height: 1.25rem; } }
    .call-accept { background: var(--tf-success); }
    .call-reject { background: var(--tf-danger); }
    .call-mute { background: var(--tf-text-muted); }
    .call-mute--active { background: var(--tf-danger); }
    .call-share { background: var(--tf-text-muted); }
    .call-share--active { background: var(--tf-primary); }

    .call-float {
      position: fixed; left: 1rem; bottom: 1rem; z-index: 9999;
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--tf-surface);
      border: 1px solid var(--tf-border);
      border-radius: 999px;
      padding: 0.5rem 0.75rem;
      box-shadow: 0 8px 30px rgba(0,0,0,0.18);
    }
    .call-float-info {
      display: flex; align-items: center; gap: 0.5rem;
      cursor: pointer;
      padding-right: 0.5rem;
      border-right: 1px solid var(--tf-border);
    }
    .call-float-avatares { display: flex; }
    .call-float-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: var(--tf-primary-light); color: var(--tf-primary);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.8rem;
      border: 2px solid var(--tf-surface);
      margin-left: -8px;
      &:first-child { margin-left: 0; }
    }
    .call-float-meta { display: flex; align-items: center; gap: 0.4rem; }
    .call-float-duracao {
      font-size: 0.85rem; font-weight: 700; color: var(--tf-text-primary);
      font-variant-numeric: tabular-nums;
    }
    .call-float-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--tf-success);
      animation: pulse-verde 2s infinite;
    }
    .call-float-actions { display: flex; align-items: center; gap: 0.4rem; }
    .call-float-btn {
      width: 38px; height: 38px; border-radius: 50%; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      background: var(--tf-surface-hover); color: var(--tf-text-muted);
      transition: transform 0.1s;
      &:hover { transform: scale(1.1); }
      mat-icon { font-size: 1.15rem; width: 1.15rem; height: 1.15rem; }
    }
    .call-float-btn.ativo { background: var(--tf-primary); color: #fff; }
    .call-float-btn--danger { background: var(--tf-danger); color: #fff; }
  `],
})
export class CallModalComponent {
  callService = inject(CallService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  mostrarBusca = false;
  termoBusca = '';
  sugestoes: { id: number; nome: string }[] = [];

  videoAtivo(): boolean {
    return this.callService.remoteVideos().length > 0 || !!this.callService.screenPreview();
  }

  buscar(): void {
    const t = normalizarTexto(this.termoBusca);
    const meuId = this.auth.usuario()?.id;
    if (!t || t.length < 1) { this.sugestoes = []; return; }

    this.http.get<any[]>('/api/Usuarios').subscribe(usuarios => {
      this.sugestoes = usuarios
        .filter((u: any) => u.id !== meuId && normalizarTexto(u.nome).includes(t) && !this.callService.callState().participants.find(p => p.userId === u.id))
        .slice(0, 6)
        .map((u: any) => ({ id: u.id, nome: u.nome }));
    });
  }

  adicionar(id: number, nome: string): void {
    this.callService.adicionarParticipante(id);
    this.termoBusca = '';
    this.sugestoes = [];
  }

  alternarTela(): void {
    if (this.callService.callState().compartilhandoTela) {
      this.callService.pararCompartilhamento();
    } else {
      this.callService.compartilharTela();
    }
  }

  participanteNome(userId: number): string {
    return this.callService.callState().participants.find(p => p.userId === userId)?.nome || `Usuário ${userId}`;
  }

  nomesOcupados(): string {
    return this.callService.avisoOcupados().map(o => o.nome).join(', ');
  }
}
