import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { PrioridadeTarefa, TipoTarefa, Projeto, QuadroConfiguracao, ProjetoMembro } from '../core/models';
import { ProjetoService } from '../features/projetos/projeto.service';
import { QuadroConfiguracaoService } from '../features/projetos/quadro-configuracao.service';

@Component({
  selector: 'app-global-task-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './global-task-dialog.html',
  styleUrl: './global-task-dialog.scss',
})
export class GlobalTaskDialogComponent {
  form: FormGroup;
  projetos: Projeto[] = [];
  colunas: QuadroConfiguracao[] = [];
  membros: ProjetoMembro[] = [];

  readonly tiposVisuais = [
    { value: TipoTarefa.Tarefa, label: 'Tarefa', icon: 'task_alt' },
    { value: TipoTarefa.Bug, label: 'Bug', icon: 'bug_report' },
    { value: TipoTarefa.Melhoria, label: 'Melhoria', icon: 'auto_awesome' },
    { value: TipoTarefa.Historia, label: 'Historia', icon: 'auto_stories' },
  ];

  prioridades = [
    { value: PrioridadeTarefa.Baixa, label: 'Baixa' },
    { value: PrioridadeTarefa.Media, label: 'Media' },
    { value: PrioridadeTarefa.Alta, label: 'Alta' },
    { value: PrioridadeTarefa.Critica, label: 'Critica' },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GlobalTaskDialogComponent>,
    private projetoService: ProjetoService,
    private quadroService: QuadroConfiguracaoService,
    @Inject(MAT_DIALOG_DATA) public data: { criadorId: number },
  ) {
    this.form = this.fb.group({
      projetoId: [null, Validators.required],
      status: [null, Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(300)]],
      descricao: ['', Validators.maxLength(5000)],
      prioridade: [PrioridadeTarefa.Media, Validators.required],
      tipo: [TipoTarefa.Tarefa, Validators.required],
      responsavelIds: [[]],
    });

    this.projetoService.listar().subscribe(p => this.projetos = p);
  }

  onProjetoChange(projetoId: number) {
    this.colunas = [];
    this.membros = [];
    this.form.patchValue({ status: null, responsavelIds: [] });

    this.projetoService.obter(projetoId).subscribe(projeto => {
      this.membros = projeto.membros || [];
    });

    this.quadroService.listarPorProjeto(projetoId).subscribe(colunas => {
      this.colunas = colunas;
      const primeira = colunas.find(c => c.visivel);
      if (primeira) this.form.patchValue({ status: primeira.status });
    });
  }

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close({
      ...this.form.value,
      sprintId: undefined,
      criadorId: this.data.criadorId,
    });
  }

  fechar() {
    this.dialogRef.close();
  }
}
