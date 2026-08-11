import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SlicePipe } from '@angular/common';
import { Atendimento, STATUS_CONTATO_OPTIONS } from './clientes-data';

@Component({
  selector: 'app-atendimento-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    FormsModule, SlicePipe, TextFieldModule,
  ],
  templateUrl: './atendimento-dialog.html',
  styleUrl: './atendimento-dialog.scss',
})
export class AtendimentoDialogComponent {
  readonly statusOptions = STATUS_CONTATO_OPTIONS;

  editando: Atendimento;

  constructor(
    private dialogRef: MatDialogRef<AtendimentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { atendimento: Atendimento },
  ) {
    this.editando = { ...data.atendimento };
  }

  fechar() {
    this.dialogRef.close();
  }

  salvar() {
    console.log('Dados salvos:', this.editando);
    this.dialogRef.close(this.editando);
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
}
