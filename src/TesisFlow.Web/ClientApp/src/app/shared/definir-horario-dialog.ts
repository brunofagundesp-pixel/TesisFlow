import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-definir-horario-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, FormsModule],
  template: `
    <div class="dh-wrap">
      <div class="dh-icone"><mat-icon>schedule</mat-icon></div>
      <h2 mat-dialog-title class="dh-titulo">Definir horário</h2>
      <mat-dialog-content class="dh-content">
        <p class="dh-tarefa">{{ data.titulo }}</p>
        <p class="dh-data">Para <strong>{{ dataLabel }}</strong></p>
        <label class="dh-field">
          <span class="dh-field-label">Horário</span>
          <input type="time" [(ngModel)]="hora" class="dh-input" />
        </label>
      </mat-dialog-content>
      <mat-dialog-actions align="end" class="dh-actions">
        <button mat-button (click)="cancelar()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="confirmar()" [disabled]="!hora">Confirmar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dh-wrap { padding: 0.25rem 0 0.5rem; min-width: 320px; }
    .dh-icone {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      margin: 0 auto 0.5rem;
      border-radius: 50%;
      background: var(--tf-primary-light);
      color: var(--tf-primary);

      mat-icon { font-size: 1.5rem; width: 1.5rem; height: 1.5rem; }
    }
    .dh-titulo { text-align: center; font-size: 1.05rem; font-weight: 700; color: var(--tf-text-primary); margin: 0 0 0.75rem; }
    .dh-content { text-align: center; }
    .dh-tarefa {
      margin: 0 0 0.25rem;
      font-size: 0.88rem;
      color: var(--tf-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dh-data { margin: 0 0 1rem; font-size: 0.85rem; color: var(--tf-text-muted); }
    .dh-field { display: flex; flex-direction: column; gap: 0.35rem; align-items: center; }
    .dh-field-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--tf-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .dh-input {
      padding: 0.45rem 0.7rem;
      border: 1px solid var(--tf-border);
      border-radius: 8px;
      font-size: 1rem;
      color: var(--tf-text-body);
      background: var(--tf-surface);
      outline: none;

      &:focus { border-color: var(--tf-primary); }
    }
    .dh-actions { padding-top: 0.5rem; }
  `],
})
export class DefinirHorarioDialogComponent {
  hora: string;

  constructor(
    private dialogRef: MatDialogRef<DefinirHorarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { data: Date; titulo: string; horaInicial?: string },
  ) {
    this.hora = data.horaInicial || '09:00';
  }

  get dataLabel(): string {
    return this.data.data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  cancelar() {
    this.dialogRef.close(null);
  }

  confirmar() {
    this.dialogRef.close(this.hora);
  }
}
