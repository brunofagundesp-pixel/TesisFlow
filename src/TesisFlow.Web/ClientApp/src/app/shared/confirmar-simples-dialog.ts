import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmar-simples-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <p class="confirm-simples-message">{{ data.mensagem }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar(false)">Cancelar</button>
      <button mat-flat-button [color]="data.cor || 'warn'" (click)="fechar(true)">{{ data.textoBotao }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .confirm-simples-message { margin-bottom: 1rem; color: var(--tf-text-secondary); font-size: 0.9rem; }
  `]
})
export class ConfirmarSimplesDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmarSimplesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titulo: string; mensagem: string; textoBotao: string; cor?: string },
  ) {}

  fechar(resultado: boolean) {
    this.dialogRef.close(resultado);
  }
}
