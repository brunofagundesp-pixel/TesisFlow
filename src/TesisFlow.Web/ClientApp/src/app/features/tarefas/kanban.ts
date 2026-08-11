import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CdkDragDrop, CdkDropList, CdkDrag,
  CdkDropListGroup, moveItemInArray, transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, switchMap, EMPTY } from 'rxjs';
import { ProjetoService } from '../projetos/projeto.service';
import { QuadroConfiguracaoService } from '../projetos/quadro-configuracao.service';
import { TarefaService } from './tarefa.service';
import { TarefaDialogComponent } from './tarefa-dialog';
import { TarefaDetalheModalComponent } from '../projetos/tarefa-detalhe-modal';
import { ProjetoMembroDialogComponent } from '../projetos/projeto-membro-dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog';
import { AuthService } from '../../core/services/auth.service';
import { Projeto, Tarefa, StatusTarefa, TipoTarefa, PrioridadeTarefa, QuadroConfiguracao, TarefaSave } from '../../core/models';

interface ColunaKanban {
  status: StatusTarefa;
  titulo: string;
  cor: string;
  tarefas: Tarefa[];
}

const CORES_STATUS: Record<number, string> = {
  [StatusTarefa.Backlog]: '#94a3b8',
  [StatusTarefa.Fazer]: '#3b82f6',
  [StatusTarefa.Andamento]: '#f59e0b',
  [StatusTarefa.Revisao]: '#8b5cf6',
  [StatusTarefa.Feito]: '#16a34a',
  [StatusTarefa.Cancelado]: '#ef4444',
};

const TITULOS_STATUS: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

@Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [CommonModule, CdkDropList, CdkDrag, CdkDropListGroup, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatMenuModule, MatChipsModule, MatBadgeModule, MatDividerModule, MatTooltipModule, RouterLink, FormsModule],
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
})
export class KanbanComponent implements OnInit, OnDestroy {
  projeto?: Projeto;
  colunas: ColunaKanban[] = [];
  loading = true;
  erro = '';
  viewAtiva: 'quadros' | 'lista' = 'quadros';
  tarefaMenu: Tarefa | null = null;
  menuPos = { top: 0, left: 0 };
  private paramsSub?: Subscription;

  todasTarefas: Tarefa[] = [];
  termoBusca = '';

  filtroStatus = new Set<number>();
  filtroPrioridade = new Set<number>();
  filtroTipo = new Set<number>();
  filtroResponsavel = new Set<number>();

  filtroCategoriaAtiva: 'status' | 'prioridade' | 'tipo' | 'responsavel' = 'status';

  readonly statusEntries: [number, string][] = [
    [StatusTarefa.Backlog, 'Backlog'],
    [StatusTarefa.Fazer, 'A Fazer'],
    [StatusTarefa.Andamento, 'Em Andamento'],
    [StatusTarefa.Revisao, 'Revisao'],
    [StatusTarefa.Feito, 'Concluido'],
    [StatusTarefa.Cancelado, 'Cancelado'],
  ];
  readonly prioridadeEntries: [number, string][] = [
    [PrioridadeTarefa.Baixa, 'Baixa'],
    [PrioridadeTarefa.Media, 'Media'],
    [PrioridadeTarefa.Alta, 'Alta'],
    [PrioridadeTarefa.Critica, 'Critica'],
  ];
  readonly tipoEntries: [number, string][] = [
    [TipoTarefa.Tarefa, 'Tarefa'],
    [TipoTarefa.Bug, 'Bug'],
    [TipoTarefa.Melhoria, 'Melhoria'],
    [TipoTarefa.Historia, 'Historia'],
  ];

  get filtroCount(): number {
    return this.filtroStatus.size + this.filtroPrioridade.size + this.filtroTipo.size + this.filtroResponsavel.size;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projetoService: ProjetoService,
    private quadroService: QuadroConfiguracaoService,
    private tarefaService: TarefaService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    this.paramsSub = this.route.params.pipe(
      switchMap(params => {
        const id = Number(params['id']);
        if (!id) {
          this.erro = 'Projeto invalido.';
          this.loading = false;
          this.cdr.markForCheck();
          return EMPTY;
        }

        this.loading = true;
        this.erro = '';
        this.cdr.markForCheck();

        return forkJoin({
          projeto: this.projetoService.obter(id),
          tarefas: this.tarefaService.listarPorProjeto(id),
          quadros: this.quadroService.listarPorProjeto(id),
        });
      })
    ).subscribe({
      next: ({ projeto, tarefas, quadros }) => {
        this.projeto = projeto;
        this.todasTarefas = tarefas;
        this.colunas = this.construirColunas(quadros);
        this.aplicarFiltros();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Erro ao carregar o projeto. Verifique se a API esta rodando.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy() {
    this.paramsSub?.unsubscribe();
  }

  carregarTarefas(projetoId: number) {
    this.tarefaService.listarPorProjeto(projetoId).subscribe({
      next: tarefas => {
        this.todasTarefas = tarefas;
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: err => console.error('Erro ao carregar tarefas:', err),
    });
  }

  aplicarFiltros() {
    let tarefas = this.todasTarefas;

    const termo = this.termoBusca.trim().toLowerCase();
    if (termo) {
      tarefas = tarefas.filter(t =>
        t.titulo.toLowerCase().includes(termo) ||
        (t.chave?.toLowerCase() ?? '').includes(termo) ||
        (t.descricao?.toLowerCase() ?? '').includes(termo)
      );
    }

    if (this.filtroStatus.size > 0) {
      tarefas = tarefas.filter(t => this.filtroStatus.has(t.status));
    }
    if (this.filtroPrioridade.size > 0) {
      tarefas = tarefas.filter(t => this.filtroPrioridade.has(t.prioridade));
    }
    if (this.filtroTipo.size > 0) {
      tarefas = tarefas.filter(t => this.filtroTipo.has(t.tipo));
    }
    if (this.filtroResponsavel.size > 0) {
      tarefas = tarefas.filter(t => t.responsaveis.some(r => this.filtroResponsavel.has(r.id)));
    }

    this.distribuirTarefas(tarefas);
  }

  limparFiltros() {
    this.termoBusca = '';
    this.filtroStatus.clear();
    this.filtroPrioridade.clear();
    this.filtroTipo.clear();
    this.filtroResponsavel.clear();
    this.aplicarFiltros();
  }

  toggleFiltro(tipo: 'status' | 'prioridade' | 'tipo' | 'responsavel', valor: number) {
    const filtro = this[`filtro${tipo.charAt(0).toUpperCase() + tipo.slice(1)}` as keyof this] as unknown as Set<number>;
    if (filtro.has(valor)) {
      filtro.delete(valor);
    } else {
      filtro.add(valor);
    }
    this.aplicarFiltros();
  }

  distribuirTarefas(tarefas: Tarefa[]) {
    for (const coluna of this.colunas) {
      coluna.tarefas = tarefas
        .filter(t => t.status === coluna.status)
        .sort((a, b) => a.ordem - b.ordem);
    }
  }

  get hasResults(): boolean {
    return this.colunas.some(c => c.tarefas.length > 0);
  }

  construirColunasPadrao(): ColunaKanban[] {
    return Object.entries(CORES_STATUS).map(([status, cor]) => ({
      status: Number(status) as StatusTarefa,
      titulo: TITULOS_STATUS[Number(status)] || '',
      cor,
      tarefas: [],
    }));
  }

  private construirColunas(quadros: QuadroConfiguracao[]): ColunaKanban[] {
    if (quadros.length > 0) {
      return quadros.map(q => ({
        status: q.status,
        titulo: q.titulo,
        cor: CORES_STATUS[q.status] || '#94a3b8',
        tarefas: [],
      }));
    }
    return this.construirColunasPadrao();
  }

  soltar(event: CdkDragDrop<Tarefa[]>, novoStatus: StatusTarefa) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.atualizarOrdens(event.container.data, novoStatus);
      this.cdr.markForCheck();
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const tarefa = event.container.data[event.currentIndex];
      tarefa.status = novoStatus;
      this.cdr.markForCheck();
      this.tarefaService.mover({ id: tarefa.id, status: novoStatus, ordem: event.currentIndex }).subscribe({
        error: err => console.error('Erro ao mover tarefa:', err),
      });
    }
  }

  atualizarOrdens(tarefas: Tarefa[], status: StatusTarefa) {
    tarefas.forEach((t, i) => {
      if (t.ordem !== i) {
        t.ordem = i;
        this.tarefaService.mover({ id: t.id, status, ordem: i }).subscribe({
          error: err => console.error('Erro ao atualizar ordem:', err),
        });
      }
    });
  }

  tipoLabel(tipo: TipoTarefa): string {
    const labels: Record<number, string> = {
      [TipoTarefa.Tarefa]: 'Tarefa', [TipoTarefa.Bug]: 'Bug',
      [TipoTarefa.Melhoria]: 'Melhoria', [TipoTarefa.Historia]: 'Historia',
    };
    return labels[tipo] || 'Tarefa';
  }

  prioridadeLabel(p: PrioridadeTarefa): string {
    const labels: Record<number, string> = {
      [PrioridadeTarefa.Baixa]: 'Baixa', [PrioridadeTarefa.Media]: 'Media',
      [PrioridadeTarefa.Alta]: 'Alta', [PrioridadeTarefa.Critica]: 'Critica',
    };
    return labels[p] || 'Media';
  }

  prioridadeIcone(p: PrioridadeTarefa): string {
    const icones: Record<number, string> = {
      [PrioridadeTarefa.Baixa]: 'arrow_downward',
      [PrioridadeTarefa.Media]: 'remove',
      [PrioridadeTarefa.Alta]: 'arrow_upward',
      [PrioridadeTarefa.Critica]: 'priority_high',
    };
    return icones[p] || 'remove';
  }

  statusLabel(status: StatusTarefa): string {
    return TITULOS_STATUS[status] || '';
  }

  tipoIcone(tipo: number): string {
    const icones: Record<number, string> = {
      [TipoTarefa.Tarefa]: 'task_alt', [TipoTarefa.Bug]: 'bug_report',
      [TipoTarefa.Melhoria]: 'auto_awesome', [TipoTarefa.Historia]: 'auto_stories',
    };
    return icones[tipo] || 'task_alt';
  }

  voltar() { this.router.navigate(['/projetos']); }

  toggleMenuAcoes(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    if (this.tarefaMenu?.id === tarefa.id) {
      this.tarefaMenu = null;
      return;
    }
    this.tarefaMenu = tarefa;
    const btn = (event.target as HTMLElement).closest('button')!;
    const rect = btn.getBoundingClientRect();
    this.menuPos = { top: rect.top, left: rect.right + 8 };
  }

  @HostListener('document:click', ['$event'])
  fecharMenuAcoes(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.card-menu-btn') || target.closest('.lista-menu-btn') || target.closest('.acao-dropdown')) return;
    this.tarefaMenu = null;
  }

  excluirTarefa(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Excluir tarefa',
        mensagem: 'Esta acao nao pode ser desfeita. A tarefa sera removida permanentemente.',
        textoConfirmacao: 'excluir',
      },
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.tarefaService.excluir(id).subscribe({
        next: () => this.carregarTarefas(this.projeto!.id),
        error: err => console.error('Erro ao excluir tarefa:', err),
      });
    });
  }

  abrirConvidar() {
    if (!this.projeto) return;
    const dialogRef = this.dialog.open(ProjetoMembroDialogComponent, {
      width: '420px',
      data: { projetoId: this.projeto.id, projetoNome: this.projeto.nome },
    });

    dialogRef.afterClosed().subscribe(email => {
      if (email) {
        this.projetoService.convidarMembro(this.projeto!.id, email).subscribe({
          next: () => this.carregarTarefas(this.projeto!.id),
          error: err => console.error('Erro ao convidar:', err),
        });
      }
    });
  }

  abrirNovaTarefa(status: StatusTarefa) {
    if (!this.projeto || !this.auth.usuario()) return;
    const dialogRef = this.dialog.open(TarefaDialogComponent, {
      width: '520px',
      data: {
        projetoId: this.projeto.id,
        status,
        criadorId: this.auth.usuario()!.id,
        membros: this.projeto?.membros || [],
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      const tempId = -Date.now();
      const tarefaTemp: Tarefa = {
        id: tempId,
        titulo: result.titulo,
        descricao: result.descricao,
        status: result.status,
        prioridade: result.prioridade,
        tipo: result.tipo,
        ordem: 9999,
        projetoId: result.projetoId,
        projetoNome: this.projeto!.nome,
        responsaveis: [],
        criadorId: result.criadorId,
        criadorNome: this.auth.usuario()?.nome || '',
        dataCriacao: new Date().toISOString(),
        quantidadeComentarios: 0,
        criando: true,
      };

      this.todasTarefas = [...this.todasTarefas, tarefaTemp];
      this.aplicarFiltros();
      this.cdr.detectChanges();

      this.tarefaService.criar(result).subscribe({
        next: () => this.carregarTarefas(this.projeto!.id),
        error: () => {
          this.todasTarefas = this.todasTarefas.filter(t => t.id !== tempId);
          this.aplicarFiltros();
          this.cdr.detectChanges();
        },
      });
    });
  }

  abrirTarefa(tarefa: Tarefa) {
    const membros = this.projeto?.membros || [];
    const dialogRef = this.dialog.open(TarefaDetalheModalComponent, {
      width: '1280px',
      maxWidth: '95vw',
      data: { tarefa, membros },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const dto: TarefaSave = {
          titulo: result.titulo,
          descricao: result.descricao,
          status: result.status,
          prioridade: result.prioridade,
          tipo: result.tipo,
          projetoId: this.projeto!.id,
          responsavelIds: result.responsavelIds || [],
          criadorId: tarefa.criadorId,
        };
        this.tarefaService.atualizar(tarefa.id, dto).subscribe({
          next: () => this.carregarTarefas(this.projeto!.id),
          error: err => console.error('Erro ao salvar tarefa:', err),
        });
      }
    });
  }
}
