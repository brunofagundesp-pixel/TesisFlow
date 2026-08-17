import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { PrioridadeTarefa, StatusTarefa, Projeto, QuadroConfiguracao, ProjetoMembro, ColegioRef } from '../core/models';
import { ProjetoService } from '../features/projetos/projeto.service';
import { QuadroConfiguracaoService } from '../features/projetos/quadro-configuracao.service';
import { ColegioSelectComponent } from './colegio-select/colegio-select';
import { CategoriaSelectComponent } from '../features/categorias/categoria-select';
import { toDateTimeLocal, toUtcIso } from '../core/utils/date.util';

const PRIORIDADE_ICONES: Record<number, string> = {
  [PrioridadeTarefa.Baixa]: 'arrow_downward',
  [PrioridadeTarefa.Media]: 'drag_handle',
  [PrioridadeTarefa.Alta]: 'arrow_upward',
  [PrioridadeTarefa.Critica]: 'priority_high',
};

const PRIORIDADE_LABELS: Record<number, string> = {
  [PrioridadeTarefa.Baixa]: 'Baixa',
  [PrioridadeTarefa.Media]: 'Media',
  [PrioridadeTarefa.Alta]: 'Alta',
  [PrioridadeTarefa.Critica]: 'Critica',
};

@Component({
  selector: 'app-global-task-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatMenuModule, ColegioSelectComponent, CategoriaSelectComponent],
  templateUrl: './global-task-dialog.html',
  styleUrl: './global-task-dialog.scss',
})
export class GlobalTaskDialogComponent {
  form: FormGroup;
  projetos: Projeto[] = [];
  colunas: QuadroConfiguracao[] = [];
  membros: ProjetoMembro[] = [];
  private statusSelecionado: StatusTarefa | null = null;

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
    @Inject(MAT_DIALOG_DATA) public data: { criadorId: number; projetoId?: number; status?: StatusTarefa; projeto?: Projeto; colunas?: QuadroConfiguracao[] },
  ) {
    this.form = this.fb.group({
      projetoId: [this.data.projetoId ?? null, Validators.required],
      titulo: ['', [Validators.required, Validators.maxLength(300)]],
      descricao: ['', Validators.maxLength(5000)],
      prioridade: [PrioridadeTarefa.Media, Validators.required],
      tipo: [1, Validators.required],
      responsavelIds: [[]],
      colegio: [null],
      contatoNome: [''],
      dataEntrega: [this.dataEntregaPadrao()],
    });

    if (this.data.projetoId != null) {
      if (this.data.projeto) {
        this.projetos = [this.data.projeto];
        this.membros = this.montarMembros(this.data.projeto);
      }
      if (this.data.colunas) {
        this.colunas = this.data.colunas;
      }

      const status = this.data.status != null
        ? (this.colunas.find(c => c.status === this.data.status) ?? this.colunas.find(c => c.visivel))?.status ?? this.data.status
        : this.colunas.find(c => c.visivel)?.status;
      this.statusSelecionado = status ?? StatusTarefa.Fazer;

      this.projetoService.listar().subscribe(p => this.projetos = p);
    } else {
      this.projetoService.listar().subscribe(p => this.projetos = p);
    }
  }

  onProjetoChange(projetoId: number, statusPreferido?: StatusTarefa) {
    this.colunas = [];
    this.membros = [];
    this.statusSelecionado = null;
    this.form.patchValue({ responsavelIds: [] });

    this.projetoService.obter(projetoId).subscribe(projeto => {
      this.membros = this.montarMembros(projeto);
    });

    this.quadroService.listarPorProjeto(projetoId).subscribe(colunas => {
      this.colunas = colunas;
      const alvo = statusPreferido != null
        ? colunas.find(c => c.status === statusPreferido)
        : colunas.find(c => c.visivel);
      this.statusSelecionado = alvo?.status ?? StatusTarefa.Fazer;
    });
  }

  salvar() {
    if (this.form.invalid) return;
    const colegio: ColegioRef | null = this.form.value.colegio || null;
    this.dialogRef.close({
      ...this.form.value,
      status: this.statusSelecionado ?? StatusTarefa.Fazer,
      dataEntrega: toUtcIso(this.form.value.dataEntrega),
      sprintId: undefined,
      criadorId: this.data.criadorId,
      colegioId: colegio?.id ?? null,
      colegioNome: colegio?.nome ?? null,
      colegio: undefined,
    });
  }

  nomeProjetoFixado(): string {
    if (this.data.projeto?.nome) return this.data.projeto.nome;
    return this.projetos.find(p => p.id === this.data.projetoId)?.nome || '';
  }

  private montarMembros(projeto: Projeto): ProjetoMembro[] {
    const membros = [...(projeto.membros || [])];
    if (projeto.liderId && !membros.some(m => m.usuarioId === projeto.liderId)) {
      membros.unshift({
        id: 0,
        projetoId: projeto.id,
        usuarioId: projeto.liderId,
        usuarioNome: projeto.liderNome || 'Líder',
        papel: 'Lider',
      });
    }
    return membros;
  }

  private dataEntregaPadrao(): string {
    const agoraMais48h = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return toDateTimeLocal(agoraMais48h.toISOString());
  }

  fechar() {
    this.dialogRef.close();
  }

  prioridadeAtual(): PrioridadeTarefa {
    return this.form.get('prioridade')?.value ?? PrioridadeTarefa.Media;
  }

  prioridadeLabel(p: PrioridadeTarefa): string {
    return PRIORIDADE_LABELS[p] || 'Media';
  }

  prioridadeIcone(p: PrioridadeTarefa): string {
    return PRIORIDADE_ICONES[p] || 'drag_handle';
  }
}
