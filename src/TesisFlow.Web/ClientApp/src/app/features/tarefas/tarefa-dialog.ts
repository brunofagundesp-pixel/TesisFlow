import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PrioridadeTarefa, TipoTarefa, StatusTarefa, ProjetoMembro } from '../../core/models';

@Component({
  selector: 'app-tarefa-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './tarefa-dialog.html',
  styleUrl: './tarefa-dialog.scss',
})
export class TarefaDialogComponent {
  form: FormGroup;
  membros: ProjetoMembro[];
  prioridades = [
    { value: PrioridadeTarefa.Baixa, label: 'Baixa' },
    { value: PrioridadeTarefa.Media, label: 'Media' },
    { value: PrioridadeTarefa.Alta, label: 'Alta' },
    { value: PrioridadeTarefa.Critica, label: 'Critica' },
  ];
  tipos = [
    { value: TipoTarefa.Tarefa, label: 'Tarefa' },
    { value: TipoTarefa.Bug, label: 'Bug' },
    { value: TipoTarefa.Melhoria, label: 'Melhoria' },
    { value: TipoTarefa.Historia, label: 'Historia' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TarefaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projetoId: number; status: StatusTarefa; criadorId: number; membros: ProjetoMembro[] },
  ) {
    this.membros = data.membros;
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(300)]],
      descricao: ['', Validators.maxLength(5000)],
      prioridade: [PrioridadeTarefa.Media, Validators.required],
      tipo: [TipoTarefa.Tarefa, Validators.required],
      responsavelIds: [[]],
    });
  }

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close({
      ...this.form.value,
      projetoId: this.data.projetoId,
      status: this.data.status,
      criadorId: this.data.criadorId,
    });
  }

  fechar() {
    this.dialogRef.close();
  }
}
