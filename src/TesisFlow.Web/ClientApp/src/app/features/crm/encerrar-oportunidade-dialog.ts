import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MOTIVO_ENCERRAMENTO_OPTIONS } from './crm-data';

@Component({
  selector: 'app-encerrar-oportunidade-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Encerrar oportunidade</h2>
    <mat-dialog-content class="encerrar-content">
      <label class="encerrar-label">Situação</label>
      <mat-form-field appearance="outline" class="encerrar-select">
        <mat-select [(ngModel)]="tipo">
          <mat-option [value]="6">Não interessado</mat-option>
          <mat-option [value]="7">Oportunidade perdida</mat-option>
        </mat-select>
      </mat-form-field>

      <label class="encerrar-label">Motivo</label>
      <mat-form-field appearance="outline" class="encerrar-select">
        <mat-select [(ngModel)]="motivo" placeholder="Selecione o motivo">
          @for (m of motivoOptions; track m) {
            <mat-option [value]="m">{{ m }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <label class="encerrar-label">Observação (opcional)</label>
      <textarea class="encerrar-textarea" rows="3" placeholder="Detalhes..." [(ngModel)]="observacao"></textarea>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button mat-flat-button color="warn" (click)="confirmar()" [disabled]="!motivo">Encerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .encerrar-content { display: flex; flex-direction: column; gap: 0.4rem; min-width: 380px; }
    .encerrar-label { font-size: 0.72rem; font-weight: 700; color: var(--tf-text-muted); text-transform: uppercase; }
    .encerrar-select { width: 100%; }
    .encerrar-textarea {
      width: 100%;
      border: 1.5px solid var(--tf-border-input);
      border-radius: 10px;
      padding: 0.55rem 0.75rem;
      font-size: 0.9rem;
      font-family: inherit;
      color: var(--tf-text-primary);
      resize: none;
      outline: none;
      box-sizing: border-box;
    }
  `]
})
export class EncerrarOportunidadeDialogComponent {
  readonly motivoOptions = MOTIVO_ENCERRAMENTO_OPTIONS;
  tipo = 6;
  motivo = '';
  observacao = '';

  constructor(private dialogRef: MatDialogRef<EncerrarOportunidadeDialogComponent>) {}

  confirmar() {
    this.dialogRef.close({ etapa: this.tipo, motivo: this.motivo, observacao: this.observacao.trim() || null });
  }

  fechar() {
    this.dialogRef.close();
  }
}
