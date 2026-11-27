import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { normalizarTexto } from '../core/utils/texto.util';

export interface MembroMencao {
  usuarioId: number;
  usuarioNome: string;
  usuarioFoto?: string;
}

@Component({
  selector: 'app-mencao-dropdown',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (visivel && filtrados.length > 0) {
      <div class="mencao-dropdown" [style.top.px]="top ?? 0" [style.left.px]="left ?? 0">
        <div class="mencao-header">Mencionar usuario</div>
        @for (m of filtrados; track m.usuarioId) {
          <div class="mencao-item" (click)="selecionar(m)">
            <span class="mencao-item-foto">{{ m.usuarioNome.charAt(0) }}</span>
            <div class="mencao-item-info">
              <span class="mencao-item-nome">{{ m.usuarioNome }}</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .mencao-dropdown {
      position: absolute;
      top: 0;
      left: 0;
      max-height: 260px;
      width: 280px;
      overflow-y: auto;
      background: var(--tf-surface);
      border: 1px solid var(--tf-border);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      z-index: 9999;
    }

    .mencao-header {
      padding: 0.5rem 0.85rem;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--tf-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--tf-border-light);
    }

    .mencao-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 0.85rem;
      cursor: pointer;
      transition: background 0.1s;
      border-bottom: 1px solid var(--tf-border-light);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--tf-surface-hover);
      }
    }

    .mencao-item-foto {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--tf-primary-light);
      color: var(--tf-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .mencao-item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .mencao-item-nome {
      font-size: 0.85rem;
      color: var(--tf-text-body);
      font-weight: 500;
      line-height: 1.3;
    }
  `],
})
export class MencaoDropdownComponent {
  @Input() membros: MembroMencao[] = [];
  @Input() termo = '';
  @Input() visivel = false;
  @Input() top: number | null = null;
  @Input() left: number | null = null;

  @Output() selecionado = new EventEmitter<MembroMencao>();

  get filtrados(): MembroMencao[] {
    const t = normalizarTexto(this.termo);
    if (!t) return this.membros.slice(0, 10);
    return this.membros.filter(m => normalizarTexto(m.usuarioNome).includes(t));
  }

  selecionar(m: MembroMencao) {
    this.selecionado.emit(m);
  }
}
