import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ClienteApiService } from '../clientes/cliente-api.service';
import { Cliente } from '../clientes/clientes-data';

@Component({
  selector: 'app-adicionar-escola-pipeline-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Adicionar escola à prospecção</h2>
    <mat-dialog-content class="dialog-content">
      <div class="busca-input">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Buscar escola..." [(ngModel)]="busca" (focus)="mostrar = true" (input)="mostrar = true" />
      </div>
      @if (mostrar) {
        <div class="busca-dropdown">
          @for (c of escolasFiltradas; track c.id) {
            <div class="busca-item" (click)="selecionar(c)">
              <span class="busca-avatar">{{ c.nome.charAt(0) }}</span>
              <span class="busca-nome">{{ c.nome }}</span>
              <span class="busca-cidade">{{ c.cidade }}/{{ c.estado }}</span>
            </div>
          }
          @if (escolasFiltradas.length === 0) {
            <div class="busca-vazio">Nenhuma escola encontrada</div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()" [disabled]="!selecionada">Adicionar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 420px;
      box-sizing: border-box;
    }
    .busca-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1.5px solid var(--tf-border-input);
      border-radius: 10px;
      padding: 0 0.75rem;
      background: var(--tf-surface);
      flex-shrink: 0;
    }
    .busca-input mat-icon { color: var(--tf-text-placeholder); }
    .busca-input input {
      flex: 1;
      border: none;
      outline: none;
      background: none;
      padding: 0.6rem 0;
      font-size: 0.9rem;
      font-family: inherit;
      color: var(--tf-text-primary);
      min-width: 0;
    }
    .busca-dropdown {
      border: 1px solid var(--tf-border);
      border-radius: 10px;
      max-height: 260px;
      overflow-y: auto;
      background: var(--tf-surface);
    }
    .busca-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.55rem 0.75rem;
      cursor: pointer;
    }
    .busca-item:hover { background: var(--tf-surface-soft); }
    .busca-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--tf-primary-light);
      color: var(--tf-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }
    .busca-nome {
      flex: 1;
      min-width: 0;
      font-size: 0.85rem;
      color: var(--tf-text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .busca-cidade { font-size: 0.72rem; color: var(--tf-text-muted); flex-shrink: 0; }
    .busca-vazio { padding: 0.75rem; text-align: center; color: var(--tf-text-muted); font-size: 0.82rem; }
  `]
})
export class AdicionarEscolaPipelineDialogComponent implements OnInit {
  busca = '';
  mostrar = false;
  selecionada: Cliente | null = null;

  private escolas: Cliente[] = [];

  constructor(
    private dialogRef: MatDialogRef<AdicionarEscolaPipelineDialogComponent>,
    private clienteApiService: ClienteApiService,
  ) {}

  ngOnInit(): void {
    this.clienteApiService.listarAtivos().subscribe({
      next: (escolas) => this.escolas = escolas,
      error: () => this.escolas = [],
    });
  }

  get escolasFiltradas(): Cliente[] {
    const t = this.busca.toLowerCase().trim();
    if (!t) return this.escolas.slice(0, 30);
    return this.escolas.filter(e => e.nome.toLowerCase().includes(t) || e.apelido.toLowerCase().includes(t)).slice(0, 30);
  }

  selecionar(c: Cliente): void {
    this.selecionada = c;
    this.busca = c.nome;
    this.mostrar = false;
  }

  confirmar(): void {
    if (this.selecionada) this.dialogRef.close(this.selecionada);
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
