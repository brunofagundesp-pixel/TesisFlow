import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p class="confirm-message">{{ data.mensagem }}</p>
      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Digite <strong>"{{ data.textoConfirmacao }}"</strong> para confirmar</mat-label>
        <input matInput [(ngModel)]="valor" (input)="verificar()" (keydown.enter)="confirmar()">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button mat-flat-button color="warn" [disabled]="!confirmado" (click)="confirmar()">Excluir</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-message { margin-bottom: 1rem; color: var(--tf-text-secondary); font-size: 0.9rem; }
    .w-100 { width: 100%; }
  `]
})
export class ConfirmDialogComponent {
  valor = '';
  confirmado = false;

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titulo: string; mensagem: string; textoConfirmacao: string },
  ) {}

  verificar() {
    this.confirmado = this.valor.trim().toLowerCase() === this.data.textoConfirmacao.toLowerCase();
  }

  confirmar() {
    if (this.confirmado) this.dialogRef.close(true);
  }

  fechar() {
    this.dialogRef.close(false);
  }
}
