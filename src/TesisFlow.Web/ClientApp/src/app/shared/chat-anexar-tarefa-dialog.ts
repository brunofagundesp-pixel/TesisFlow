import { Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { TarefaService } from '../features/tarefas/tarefa.service';
import { AuthService } from '../core/services/auth.service';
import { Tarefa, StatusTarefa } from '../core/models';
import { MensagemVinculo } from '../core/services/chat.service';

const STATUS_LABEL: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

@Component({
  selector: 'app-chat-anexar-tarefa-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="anexar-dialog">
      <div class="anexar-dialog-header">
        <mat-icon>attach_file</mat-icon>
        <span>Compartilhar tarefa</span>
        <button class="anexar-dialog-fechar" (click)="fechar()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="anexar-dialog-busca">
        <mat-icon>search</mat-icon>
        <input
          autofocus
          placeholder="Buscar por titulo ou chave..."
          [(ngModel)]="termo"
          (input)="onInput()"
          (keydown.enter)="$event.preventDefault()"
        />
      </div>

      <div class="anexar-dialog-lista">
        @if (carregando) {
          <div class="anexar-dialog-vazio"><mat-spinner diameter="28"></mat-spinner></div>
        } @else if (resultados.length === 0) {
          <div class="anexar-dialog-vazio">
            {{ termo.length >= 2 ? 'Nenhuma tarefa encontrada.' : 'Digite ao menos 2 caracteres para buscar.' }}
          </div>
        } @else {
          @for (t of resultados; track t.id) {
            <button class="anexar-item" (click)="selecionar(t)">
              <span class="anexar-item-icone"><mat-icon>task</mat-icon></span>
              <span class="anexar-item-info">
                <span class="anexar-item-titulo">{{ t.titulo }}</span>
                <span class="anexar-item-sub">{{ t.chave || '' }} · {{ STATUS_LABEL[t.status] }} · {{ t.projetoNome }}</span>
              </span>
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .anexar-dialog {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: var(--tf-surface);
      border-radius: 12px;
      overflow: hidden;
    }

    .anexar-dialog-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 0.9rem;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--tf-text-primary);
      border-bottom: 1px solid var(--tf-border-light);

      mat-icon { color: var(--tf-primary); }
    }

    .anexar-dialog-fechar {
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: none;
      color: var(--tf-text-muted);
      cursor: pointer;

      &:hover { background: var(--tf-surface-hover); }

      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .anexar-dialog-busca {
      position: relative;
      padding: 0 0.9rem;

      mat-icon {
        position: absolute;
        left: 1.3rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--tf-text-placeholder);
        font-size: 1.1rem;
        width: 1.1rem;
        height: 1.1rem;
      }

      input {
        width: 100%;
        padding: 0.5rem 0.75rem 0.5rem 2rem;
        border: 1.5px solid var(--tf-border-input);
        border-radius: 10px;
        font-size: 0.85rem;
        font-family: inherit;
        outline: none;
        color: var(--tf-text-primary);
        background: var(--tf-surface-soft);

        &::placeholder { color: var(--tf-text-placeholder); }
        &:focus { border-color: var(--tf-primary); background: var(--tf-surface); }
      }
    }

    .anexar-dialog-lista {
      max-height: 320px;
      overflow-y: auto;
      padding: 0 0.4rem 0.4rem;
    }

    .anexar-dialog-vazio {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      font-size: 0.8rem;
      color: var(--tf-text-muted);
    }

    .anexar-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.5rem 0.6rem;
      border: none;
      background: none;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: background 0.1s;

      &:hover { background: var(--tf-surface-soft); }
    }

    .anexar-item-icone {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: var(--tf-primary-light);
      color: var(--tf-primary);
      flex-shrink: 0;

      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }

    .anexar-item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .anexar-item-titulo {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--tf-text-body);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .anexar-item-sub {
      font-size: 0.72rem;
      color: var(--tf-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class ChatAnexarTarefaDialogComponent {
  private tarefaService = inject(TarefaService);
  private auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<ChatAnexarTarefaDialogComponent>);

  STATUS_LABEL = STATUS_LABEL;

  termo = '';
  resultados: Tarefa[] = [];
  carregando = false;
  private timer: any;

  constructor(@Inject(MAT_DIALOG_DATA) private data: { usuarioId?: number }) {}

  onInput(): void {
    clearTimeout(this.timer);
    const q = this.termo.trim();
    if (q.length < 2) {
      this.resultados = [];
      this.carregando = false;
      return;
    }
    this.carregando = true;
    this.timer = setTimeout(() => {
      const usuarioId = this.data.usuarioId ?? this.auth.usuario()?.id ?? 0;
      this.tarefaService.buscar(q, usuarioId).subscribe({
        next: tarefas => { this.resultados = tarefas; this.carregando = false; },
        error: () => { this.resultados = []; this.carregando = false; },
      });
    }, 250);
  }

  selecionar(t: Tarefa): void {
    const vinculo: MensagemVinculo = {
      tipo: 'tarefa',
      id: t.id,
      titulo: t.titulo,
      subtitulo: `${STATUS_LABEL[t.status] ?? ''} · ${t.projetoNome}`,
      link: `/tarefas/${t.chave}`,
      icone: 'task',
    };
    this.dialogRef.close(vinculo);
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
