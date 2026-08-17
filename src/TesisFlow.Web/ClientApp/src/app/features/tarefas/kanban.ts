import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ViewChild, ElementRef, NgZone } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, forkJoin, switchMap, EMPTY } from 'rxjs';
import { ProjetoService } from '../projetos/projeto.service';
import { QuadroConfiguracaoService } from '../projetos/quadro-configuracao.service';
import { TarefaService } from './tarefa.service';
import { GlobalTaskDialogComponent } from '../../shared/global-task-dialog';
import { TarefaDetalheModalComponent } from '../projetos/tarefa-detalhe-modal';
import { ProjetoMembroDialogComponent } from '../projetos/projeto-membro-dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog';
import { AuthService } from '../../core/services/auth.service';
import { MeuDiaService } from '../../core/services/meu-dia.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { Projeto, Tarefa, StatusTarefa, PrioridadeTarefa, QuadroConfiguracao, TarefaSave, TarefaMove, Categoria } from '../../core/models';
import { CategoriaService } from '../categorias/categoria.service';
import { toDateTimeLocal, toUtcIso } from '../../core/utils/date.util';

interface ColunaKanban {
  status: StatusTarefa;
  titulo: string;
  cor: string;
  tarefas: Tarefa[];
}

interface ConfeteParticle {
  left: string;
  delay: string;
  cor: string;
  tamanho: string;
  duracao: string;
  rotacao: string;
  tx: string;
  ty: string;
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
  imports: [CommonModule, CdkDropList, CdkDrag, CdkDropListGroup, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatMenuModule, MatChipsModule, MatBadgeModule, MatDividerModule, MatTooltipModule, MatSnackBarModule, RouterLink, FormsModule],
  templateUrl: './kanban.html',
  styleUrl: './kanban.scss',
})
export class KanbanComponent implements OnInit, OnDestroy {
  readonly StatusTarefa = StatusTarefa;

  private boardEl: HTMLElement | null = null;

  @ViewChild('board') set board(ref: ElementRef<HTMLElement> | undefined) {
    this.boardEl = ref?.nativeElement ?? null;
    this.configurarObserverScroll();
  }

  mostrarMinimapa = false;
  minimapaColunas: { status: StatusTarefa; left: number; width: number }[] = [];
  viewportMinimapa = { left: 0, width: 0 };
  private resizeObserver?: ResizeObserver;
  private minimapDrag = false;

  mostrarConfetti = false;
  confettiKey = 0;
  confeteParticles: ConfeteParticle[] = [];
  private confettiTimeout?: ReturnType<typeof setTimeout>;

  projeto?: Projeto;
  colunas: ColunaKanban[] = [];
  quadrosConfig: QuadroConfiguracao[] = [];
  loading = true;
  erro = '';
  viewAtiva: 'quadros' | 'lista' = 'quadros';
  tarefaMenu: Tarefa | null = null;
  menuPos = { top: 0, left: 0 };
  prioridadeMenu: Tarefa | null = null;
  prioridadeMenuPos = { top: 0, left: 0 };
  statusMenu: Tarefa | null = null;
  statusMenuPos = { top: 0, left: 0 };
  private paramsSub?: Subscription;

  todasTarefas: Tarefa[] = [];
  tarefasFiltradas: Tarefa[] = [];
  somenteMinhas = false;
  termoBusca = '';

  selecionadas = new Set<number>();
  acaoEmMassa: 'status' | 'prioridade' | null = null;
  valorEmMassa: number | null = null;
  valorEmMassaTocado = false;

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
  categorias: Categoria[] = [];

  get filtroCount(): number {
    return this.filtroStatus.size + this.filtroPrioridade.size + this.filtroTipo.size + this.filtroResponsavel.size;
  }

  get quantidadeSelecionada(): number {
    return this.selecionadas.size;
  }

  get algumaSelecionada(): boolean {
    return this.selecionadas.size > 0;
  }

  get todasSelecionadas(): boolean {
    return this.tarefasFiltradas.length > 0 && this.tarefasFiltradas.every(t => this.selecionadas.has(t.id));
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projetoService: ProjetoService,
    private quadroService: QuadroConfiguracaoService,
    private tarefaService: TarefaService,
    private categoriaService: CategoriaService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    public auth: AuthService,
    public meuDiaService: MeuDiaService,
    private notificacaoService: NotificacaoService,
    private snackbar: MatSnackBar,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    this.meuDiaService.inicializar();
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
          categorias: this.categoriaService.listarPorProjeto(id),
        });
      })
    ).subscribe({
      next: ({ projeto, tarefas, quadros, categorias }) => {
        this.projeto = projeto;
        this.todasTarefas = tarefas;
        this.quadrosConfig = quadros;
        this.categorias = categorias;
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
    this.resizeObserver?.disconnect();
  }

  private configurarObserverScroll() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;

    if (this.boardEl) {
      this.atualizarMinimapa();
      this.resizeObserver = new ResizeObserver(() => {
        this.ngZone.run(() => this.atualizarMinimapa());
      });
      this.resizeObserver.observe(this.boardEl);
    } else {
      this.mostrarMinimapa = false;
    }
  }

  onBoardScroll() {
    this.atualizarMinimapa();
  }

  private atualizarMinimapa() {
    const el = this.boardEl;
    if (!el) return;

    const scrollW = el.scrollWidth;
    const clientW = el.clientWidth;

    if (scrollW <= clientW + 4) {
      this.mostrarMinimapa = false;
      return;
    }

    this.mostrarMinimapa = true;

    const boardRect = el.getBoundingClientRect();
    const colunasEls = el.querySelectorAll<HTMLElement>('.kanban-coluna');

    const segs: { status: StatusTarefa; left: number; width: number }[] = [];
    colunasEls.forEach((col, i) => {
      const r = col.getBoundingClientRect();
      const left = r.left - boardRect.left + el.scrollLeft;
      segs.push({
        status: this.colunas[i]?.status ?? StatusTarefa.Backlog,
        left: (left / scrollW) * 100,
        width: (r.width / scrollW) * 100,
      });
    });

    this.minimapaColunas = segs;
    this.viewportMinimapa = {
      left: (el.scrollLeft / scrollW) * 100,
      width: (clientW / scrollW) * 100,
    };
  }

  onMinimapPointerDown(event: PointerEvent) {
    this.minimapDrag = true;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    this.moverMinimap(event);
    event.preventDefault();
  }

  onMinimapPointerMove(event: PointerEvent) {
    if (!this.minimapDrag) return;
    this.moverMinimap(event);
  }

  onMinimapPointerUp(event: PointerEvent) {
    this.minimapDrag = false;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  private moverMinimap(event: PointerEvent) {
    const el = this.boardEl;
    if (!el) return;

    const track = event.currentTarget as HTMLElement;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return;

    const frac = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    el.scrollLeft = frac * el.scrollWidth - el.clientWidth / 2;
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
    this.selecionadas.clear();
    this.fecharAcaoEmMassa();
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

    if (this.somenteMinhas) {
      const uid = this.auth.usuario()?.id;
      if (uid != null) {
        tarefas = tarefas.filter(t => t.responsaveis.some(r => r.id === uid));
      }
    }

    this.tarefasFiltradas = tarefas;
    this.distribuirTarefas(tarefas);
  }

  limparFiltros() {
    this.termoBusca = '';
    this.somenteMinhas = false;
    this.filtroStatus.clear();
    this.filtroPrioridade.clear();
    this.filtroTipo.clear();
    this.filtroResponsavel.clear();
    this.aplicarFiltros();
  }

  toggleMinhasTarefas() {
    this.somenteMinhas = !this.somenteMinhas;
    this.aplicarFiltros();
  }

  trocarView(view: 'quadros' | 'lista') {
    this.viewAtiva = view;
    this.limparSelecao();
  }

  toggleSelecao(tarefa: Tarefa, event: Event) {
    event.stopPropagation();
    if (this.selecionadas.has(tarefa.id)) {
      this.selecionadas.delete(tarefa.id);
    } else {
      this.selecionadas.add(tarefa.id);
    }
    this.cdr.detectChanges();
  }

  toggleSelecionarTodas() {
    if (this.todasSelecionadas) {
      this.selecionadas.clear();
    } else {
      this.tarefasFiltradas.forEach(t => this.selecionadas.add(t.id));
    }
    this.cdr.detectChanges();
  }

  abrirAcaoEmMassa(acao: 'status' | 'prioridade') {
    this.acaoEmMassa = acao;
    this.valorEmMassa = null;
    this.valorEmMassaTocado = false;
    this.cdr.detectChanges();
  }

  fecharAcaoEmMassa() {
    this.acaoEmMassa = null;
    this.valorEmMassa = null;
    this.valorEmMassaTocado = false;
  }

  limparSelecao() {
    this.selecionadas.clear();
    this.fecharAcaoEmMassa();
    this.cdr.detectChanges();
  }

  salvarEmMassa() {
    if (this.valorEmMassa == null) {
      this.valorEmMassaTocado = true;
      return;
    }

    const ids = [...this.selecionadas];
    const usuarioId = this.auth.usuario()?.id;

    const concluir = () => {
      this.limparSelecao();
      if (this.projeto) this.carregarTarefas(this.projeto.id);
    };

    if (this.acaoEmMassa === 'status') {
      this.tarefaService.alterarStatusEmMassa(ids, this.valorEmMassa as StatusTarefa, usuarioId).subscribe({
        next: () => { this.snackbar.open('Status atualizado.', 'OK', { duration: 3000 }); concluir(); },
        error: () => this.snackbar.open('Não foi possível atualizar o status.', 'OK', { duration: 3000 }),
      });
    } else if (this.acaoEmMassa === 'prioridade') {
      this.tarefaService.alterarPrioridadeEmMassa(ids, this.valorEmMassa as PrioridadeTarefa, usuarioId).subscribe({
        next: () => { this.snackbar.open('Prioridade atualizada.', 'OK', { duration: 3000 }); concluir(); },
        error: () => this.snackbar.open('Não foi possível atualizar a prioridade.', 'OK', { duration: 3000 }),
      });
    }
  }

  excluirSelecionadas() {
    const ids = [...this.selecionadas];
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        titulo: 'Excluir tarefas',
        mensagem: `${ids.length} ${ids.length === 1 ? 'tarefa será' : 'tarefas serão'} excluída(s) permanentemente. Esta ação não pode ser desfeita.`,
        textoConfirmacao: 'excluir',
      },
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.tarefaService.excluirEmMassa(ids).subscribe({
        next: () => {
          this.snackbar.open('Tarefas excluídas.', 'OK', { duration: 3000 });
          this.limparSelecao();
          if (this.projeto) this.carregarTarefas(this.projeto.id);
        },
        error: () => this.snackbar.open('Não foi possível excluir as tarefas.', 'OK', { duration: 3000 }),
      });
    });
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
    const itens: TarefaMove[] = [];

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.coletarOrdens(event.container.data, novoStatus, itens);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      const tarefa = event.container.data[event.currentIndex];
      tarefa.status = novoStatus;

      if (novoStatus === StatusTarefa.Feito) {
        this.dispararConfetti();
      }

      this.coletarOrdens(event.container.data, novoStatus, itens);

      const statusOrigem = event.previousContainer.data.length > 0
        ? event.previousContainer.data[0].status
        : null;
      if (statusOrigem != null) {
        this.coletarOrdens(event.previousContainer.data, statusOrigem, itens);
      }
    }

    this.cdr.markForCheck();

    if (itens.length > 0) {
      this.tarefaService.reordenar(itens).subscribe({
        error: err => console.error('Erro ao reordenar tarefas:', err),
      });
    }
  }

  private coletarOrdens(tarefas: Tarefa[], status: StatusTarefa, itens: TarefaMove[]) {
    tarefas.forEach((t, i) => {
      if (t.ordem !== i) {
        t.ordem = i;
        itens.push({ id: t.id, status, ordem: i, usuarioId: this.auth.usuario()?.id });
      }
    });
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
      [PrioridadeTarefa.Media]: 'drag_handle',
      [PrioridadeTarefa.Alta]: 'arrow_upward',
      [PrioridadeTarefa.Critica]: 'priority_high',
    };
    return icones[p] || 'drag_handle';
  }

  statusIcone(status: StatusTarefa): string {
    const icones: Record<number, string> = {
      [StatusTarefa.Backlog]: 'circle',
      [StatusTarefa.Fazer]: 'radio_button_unchecked',
      [StatusTarefa.Andamento]: 'autorenew',
      [StatusTarefa.Revisao]: 'visibility',
      [StatusTarefa.Feito]: 'check_circle',
      [StatusTarefa.Cancelado]: 'cancel',
    };
    return icones[status] || 'circle';
  }

  statusLabel(status: StatusTarefa): string {
    return TITULOS_STATUS[status] || '';
  }

  isConcluida(tarefa: Tarefa): boolean {
    return tarefa.status === StatusTarefa.Feito;
  }

  temMeuDia(tarefa: Tarefa): boolean {
    return this.meuDiaService.tem(tarefa.id);
  }

  souResponsavel(tarefa: Tarefa): boolean {
    const uid = this.auth.usuario()?.id;
    return uid != null && tarefa.responsaveis.some(r => r.id === uid);
  }

  temNotificacaoNaoLida(tarefa: Tarefa): boolean {
    return this.notificacaoService.notificacoes().some(n => !n.lida && n.tarefaId === tarefa.id);
  }

  alternarMeuDia(tarefa: Tarefa): void {
    this.meuDiaService.alternar(tarefa).subscribe({
      error: () => this.snackbar.open('Não foi possível atualizar o Meu dia.', 'OK', { duration: 3000 }),
    });
  }

  dispararConfetti(): void {
    this.confeteParticles = this.gerarConfete();
    this.confettiKey++;
    this.mostrarConfetti = true;

    clearTimeout(this.confettiTimeout);
    this.confettiTimeout = setTimeout(() => {
      this.mostrarConfetti = false;
    }, 2400);
  }

  private gerarConfete(): ConfeteParticle[] {
    const cores = ['#ff8615', '#16a34a', '#3d81f4', '#8b5cf6', '#db2777', '#f59e0b', '#0284c7'];
    const particulas: ConfeteParticle[] = [];

    for (let i = 0; i < 70; i++) {
      const angulo = Math.random() * Math.PI * 2;
      const raio = 40 + Math.random() * 220;

      particulas.push({
        left: (50 + (Math.random() * 20 - 10)).toFixed(2) + '%',
        delay: (Math.random() * 0.5).toFixed(2) + 's',
        cor: cores[Math.floor(Math.random() * cores.length)],
        tamanho: (6 + Math.random() * 7).toFixed(1) + 'px',
        duracao: (1.4 + Math.random() * 0.9).toFixed(2) + 's',
        rotacao: (Math.random() * 720 - 360).toFixed(0) + 'deg',
        tx: (Math.cos(angulo) * raio).toFixed(0) + 'px',
        ty: (Math.sin(angulo) * raio * 0.8 + 120).toFixed(0) + 'px',
      });
    }

    return particulas;
  }

  alterarStatus(tarefa: Tarefa, status: StatusTarefa) {
    if (tarefa.status === status) return;
    const anterior = tarefa.status;
    tarefa.status = status;
    this.aplicarFiltros();
    this.cdr.detectChanges();

    if (status === StatusTarefa.Feito) {
      this.dispararConfetti();
    }

    this.tarefaService.mover({ id: tarefa.id, status, ordem: tarefa.ordem, usuarioId: this.auth.usuario()?.id }).subscribe({
      error: () => {
        tarefa.status = anterior;
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
    });
  }

  voltar() { this.router.navigate(['/projetos']); }

  abrirConfiguracoes() {
    if (this.projeto) {
      this.router.navigate(['/projetos', this.projeto.id, 'configuracoes']);
    }
  }

  toggleMenuAcoes(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    this.prioridadeMenu = null;
    this.statusMenu = null;
    if (this.tarefaMenu?.id === tarefa.id) {
      this.tarefaMenu = null;
      return;
    }
    this.tarefaMenu = tarefa;
    const btn = (event.target as HTMLElement).closest('button')!;
    const rect = btn.getBoundingClientRect();
    const largura = 150;
    const leftAberto = rect.right + 8;
    const left = leftAberto + largura > window.innerWidth - 8 ? rect.left - largura - 8 : leftAberto;
    this.menuPos = { top: rect.top, left };
  }

  @HostListener('document:click', ['$event'])
  fecharMenuAcoes(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.card-menu-btn') || target.closest('.lista-menu-btn') || target.closest('.acao-dropdown')) return;
    this.tarefaMenu = null;
    if (target.closest('.tarefa-prio-icon') || target.closest('.lista-prio') || target.closest('.prioridade-dropdown')) return;
    this.prioridadeMenu = null;
    if (target.closest('.lista-status') || target.closest('.status-dropdown')) return;
    this.statusMenu = null;
  }

  togglePrioridadeMenu(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    this.tarefaMenu = null;
    this.statusMenu = null;
    if (this.prioridadeMenu?.id === tarefa.id) {
      this.prioridadeMenu = null;
      return;
    }
    this.prioridadeMenu = tarefa;
    const el = (event.target as HTMLElement).closest('.card-prio-btn, .lista-prio') ?? (event.target as HTMLElement);
    const rect = el.getBoundingClientRect();
    this.prioridadeMenuPos = { top: rect.bottom + 6, left: rect.left - 90 };
  }

  toggleStatusMenu(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    this.tarefaMenu = null;
    this.prioridadeMenu = null;
    if (this.statusMenu?.id === tarefa.id) {
      this.statusMenu = null;
      return;
    }
    this.statusMenu = tarefa;
    const el = (event.target as HTMLElement).closest('.lista-status') ?? (event.target as HTMLElement);
    const rect = el.getBoundingClientRect();
    this.statusMenuPos = { top: rect.bottom + 6, left: rect.left - 90 };
  }

  alterarPrioridade(tarefa: Tarefa, nova: PrioridadeTarefa) {
    if (tarefa.prioridade === nova) return;

    const anterior = tarefa.prioridade;
    tarefa.prioridade = nova;
    this.cdr.detectChanges();

    const dto: TarefaSave = {
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      status: tarefa.status,
      prioridade: nova,
      tipo: tarefa.tipo,
      projetoId: tarefa.projetoId,
      sprintId: tarefa.sprintId,
      responsavelIds: tarefa.responsaveis.map(r => r.id),
      criadorId: tarefa.criadorId,
      atorId: this.auth.usuario()?.id,
      colegioId: tarefa.colegioId,
      colegioNome: tarefa.colegioNome,
      contatoNome: tarefa.contatoNome,
      dataEntrega: tarefa.dataEntrega,
    };

    this.tarefaService.atualizar(tarefa.id, dto).subscribe({
      next: () => this.cdr.detectChanges(),
      error: () => {
        tarefa.prioridade = anterior;
        this.cdr.detectChanges();
      },
    });
  }

  dataEntregaLocal(tarefa: Tarefa): string {
    return toDateTimeLocal(tarefa.dataEntrega);
  }

  alterarDataEntrega(tarefa: Tarefa, event: Event) {
    const input = event.target as HTMLInputElement;
    const iso = toUtcIso(input.value);
    const anterior = tarefa.dataEntrega;
    tarefa.dataEntrega = iso ?? undefined;
    this.cdr.detectChanges();

    const dto: TarefaSave = {
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      tipo: tarefa.tipo,
      projetoId: tarefa.projetoId,
      sprintId: tarefa.sprintId,
      responsavelIds: tarefa.responsaveis.map(r => r.id),
      criadorId: tarefa.criadorId,
      atorId: this.auth.usuario()?.id,
      colegioId: tarefa.colegioId,
      colegioNome: tarefa.colegioNome,
      contatoNome: tarefa.contatoNome,
      dataEntrega: iso ?? undefined,
    };

    this.tarefaService.atualizar(tarefa.id, dto).subscribe({
      next: () => this.cdr.detectChanges(),
      error: () => {
        tarefa.dataEntrega = anterior;
        this.cdr.detectChanges();
      },
    });
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

  copiarLinkTarefa(tarefa: Tarefa) {
    const url = `${window.location.origin}/tarefas/${tarefa.chave}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackbar.open('Link copiado!', '', { duration: 2000 });
    }).catch(() => {
      this.snackbar.open('Erro ao copiar link', '', { duration: 2000 });
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
    const dialogRef = this.dialog.open(GlobalTaskDialogComponent, {
      width: '640px',
      data: {
        criadorId: this.auth.usuario()!.id,
        projetoId: this.projeto.id,
        status,
        projeto: this.projeto,
        colunas: this.quadrosConfig,
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
        colegioId: result.colegioId,
        colegioNome: result.colegioNome,
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
    this.notificacaoService.marcarTarefaLida(tarefa.id);

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
          atorId: this.auth.usuario()?.id,
          colegioId: result.colegioId ?? null,
          colegioNome: result.colegioNome ?? null,
          contatoNome: result.contatoNome ?? null,
          dataEntrega: result.dataEntrega ?? null,
        };
        this.tarefaService.atualizar(tarefa.id, dto).subscribe({
          next: () => this.carregarTarefas(this.projeto!.id),
          error: err => console.error('Erro ao salvar tarefa:', err),
        });
      }
    });
  }
}
