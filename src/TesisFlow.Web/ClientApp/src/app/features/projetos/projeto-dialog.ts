import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragHandle, moveItemInArray } from '@angular/cdk/drag-drop';
import { StatusTarefa, QuadroConfiguracaoSave } from '../../core/models';

interface QuadroSelecionado {
  status: StatusTarefa;
  titulo: string;
  habilitado: boolean;
}

@Component({
  selector: 'app-projeto-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './projeto-dialog.html',
  styleUrl: './projeto-dialog.scss',
})
export class ProjetoDialogComponent {
  form: FormGroup;

  quadros: QuadroSelecionado[] = [
    { status: StatusTarefa.Backlog, titulo: 'Backlog', habilitado: true },
    { status: StatusTarefa.Fazer, titulo: 'A Fazer', habilitado: true },
    { status: StatusTarefa.Andamento, titulo: 'Em Andamento', habilitado: true },
    { status: StatusTarefa.Revisao, titulo: 'Revisão', habilitado: false },
    { status: StatusTarefa.Feito, titulo: 'Concluído', habilitado: true },
    { status: StatusTarefa.Cancelado, titulo: 'Cancelado', habilitado: false },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProjetoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { liderId: number },
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      descricao: ['', Validators.maxLength(2000)],
      cor: ['#ff8615'],
      icone: ['', Validators.maxLength(10)],
    });
  }

  reordenarQuadros(event: CdkDragDrop<QuadroSelecionado[]>) {
    moveItemInArray(this.quadros, event.previousIndex, event.currentIndex);
  }

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close({
      ...this.form.value,
      liderId: this.data.liderId,
      quadros: this.quadros
        .filter(q => q.habilitado)
        .map((q, i): QuadroConfiguracaoSave => ({
          status: q.status,
          titulo: q.titulo,
          ordem: i,
          visivel: true,
        })),
    });
  }

  fechar() {
    this.dialogRef.close();
  }
}
