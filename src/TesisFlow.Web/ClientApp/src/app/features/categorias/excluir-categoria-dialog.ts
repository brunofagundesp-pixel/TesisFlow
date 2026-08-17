import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Categoria } from '../../core/models';

@Component({
  selector: 'app-excluir-categoria-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './excluir-categoria-dialog.html',
  styleUrl: './excluir-categoria-dialog.scss',
})
export class ExcluirCategoriaDialogComponent {
  novaCategoriaId: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<ExcluirCategoriaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { categoria: Categoria; categorias: Categoria[] },
  ) {}

  get temTarefas(): boolean {
    return (this.data.categoria.quantidadeTarefas ?? 0) > 0;
  }

  get outras(): Categoria[] {
    return this.data.categorias.filter(c => c.id !== this.data.categoria.id);
  }

  confirmar() {
    if (this.temTarefas) {
      if (this.novaCategoriaId == null) return;
      this.dialogRef.close(this.novaCategoriaId);
      return;
    }
    this.dialogRef.close(true);
  }

  cancelar() {
    this.dialogRef.close();
  }
}
