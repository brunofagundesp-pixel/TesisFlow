import { Component, OnInit, OnDestroy, ViewChild, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, Subscription, of, EMPTY, tap, finalize } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { AuthUrlPipe } from '../core/auth-url';
import { ThemeService } from '../core/services/theme.service';
import { NotificacaoService, Notificacao } from '../core/services/notificacao.service';
import { ChatService } from '../core/services/chat.service';
import { CallService } from '../core/services/call.service';
import { MeuDiaService } from '../core/services/meu-dia.service';
import { ProjetoService } from '../features/projetos/projeto.service';
import { QuadroConfiguracaoService } from '../features/projetos/quadro-configuracao.service';
import { TarefaService } from '../features/tarefas/tarefa.service';
import { ClienteApiService } from '../features/clientes/cliente-api.service';
import { Cliente } from '../features/clientes/clientes-data';
import { ProjetoDialogComponent } from '../features/projetos/projeto-dialog';
import { GlobalTaskDialogComponent } from '../shared/global-task-dialog';
import { TarefaDetalheModalComponent } from '../features/projetos/tarefa-detalhe-modal';
import { normalizarTexto } from '../core/utils/texto.util';
import { ChatPanelComponent } from './chat-panel';
import { CallModalComponent } from './call-modal';
import { Projeto, ProjetoSave, Tarefa, StatusTarefa, TarefaSave } from '../core/models';

const STATUS_LABEL: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    ReactiveFormsModule,
    DatePipe,
    AuthUrlPipe,
    ChatPanelComponent,
    CallModalComponent,
  ],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.scss',
})
export class AppLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  projetos: Projeto[] = [];
  sidebarOpen = signal(true);
  sidebarPinned = signal(true);
  projetosExpandido = signal(true);

  mostrarNotificacoes = signal(false);
  chatAberto = signal(false);

  get notificacoesFiltradas(): Notificacao[] {
    return this.notificacaoService.notificacoesFiltradas;
  }

  get naoLidasCount(): number {
    return this.notificacaoService.naoLidasCount;
  }

  naoLidasPorProjeto(projetoId: number): number {
    return this.notificacaoService.notificacoes().filter(n => !n.lida && n.projetoId === projetoId).length;
  }

  iniciaisProjeto(nome: string): string {
    const palavras = nome.trim().split(/\s+/).filter(Boolean);
    if (palavras.length > 1) {
      return `${palavras[0][0]}${palavras[1][0]}`.toUpperCase();
    }
    return (palavras[0] || '?').slice(0, 2).toUpperCase();
  }

  searchControl = new FormControl('');
  resultados: Tarefa[] = [];
  mostrarDropdown = false;
  clicouDentro = false;
  carregando = false;
  hoveredTarefa: Tarefa | null = null;
  private searchSub!: Subscription;
  private searchColegiosSub!: Subscription;
  private ultimoTermoApi = '';

  colegios: Cliente[] = [];
  colegiosFiltrados: Cliente[] = [];

  filtroProjetos = new Set<number>();
  filtroPeriodo = 'todos';
  filtroResponsavel = new Set<number>();
  filtroCategoria = new Set<number>();
  filtroStatus = new Set<number>();
  relatadasPorMim = false;

  readonly periodoOptions = [
    { value: 'todos', label: 'A qualquer momento' },
    { value: 'hoje', label: 'Hoje' },
    { value: 'ontem', label: 'Ontem' },
    { value: '7dias', label: 'Ultimos 7 dias' },
  ];

  readonly statusEntries: [number, string][] = [
    [StatusTarefa.Backlog, 'Backlog'],
    [StatusTarefa.Fazer, 'A Fazer'],
    [StatusTarefa.Andamento, 'Em Andamento'],
    [StatusTarefa.Revisao, 'Revisao'],
    [StatusTarefa.Feito, 'Concluido'],
    [StatusTarefa.Cancelado, 'Cancelado'],
  ];

  get filtroCount(): number {
    let c = this.filtroProjetos.size + this.filtroResponsavel.size + this.filtroCategoria.size + this.filtroStatus.size;
    if (this.filtroPeriodo !== 'todos') c++;
    if (this.relatadasPorMim) c++;
    return c;
  }

  get temResultados(): boolean {
    return this.resultadosFiltrados.length > 0 || this.colegiosFiltrados.length > 0;
  }

  get resultadosFiltrados(): Tarefa[] {
    let r = this.resultados;
    if (this.filtroProjetos.size > 0) r = r.filter(t => this.filtroProjetos.has(t.projetoId));
    if (this.filtroPeriodo !== 'todos') r = r.filter(t => this.filtrarPorPeriodo(t));
    if (this.filtroResponsavel.size > 0) r = r.filter(t => t.responsaveis.some(rp => this.filtroResponsavel.has(rp.id)));
    if (this.filtroCategoria.size > 0) r = r.filter(t => this.filtroCategoria.has(t.tipo));
    if (this.filtroStatus.size > 0) r = r.filter(t => this.filtroStatus.has(t.status));
    if (this.relatadasPorMim) {
      const meuId = this.auth.usuario()?.id;
      if (meuId) r = r.filter(t => t.criadorId === meuId);
    }
    return r;
  }

  get projetosUnicos(): { id: number; nome: string }[] {
    const map = new Map<number, string>();
    for (const t of this.resultados) {
      if (!map.has(t.projetoId)) map.set(t.projetoId, t.projetoNome);
    }
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }

  get responsaveisUnicos(): { id: number; nome: string }[] {
    const map = new Map<number, string>();
    for (const t of this.resultados) {
      for (const r of t.responsaveis) {
        if (!map.has(r.id)) map.set(r.id, r.nome);
      }
    }
    return Array.from(map, ([id, nome]) => ({ id, nome }));
  }

  private filtrarPorPeriodo(t: Tarefa): boolean {
    const hoje = new Date();
    const data = new Date(t.dataAtualizacao || t.dataCriacao);
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    switch (this.filtroPeriodo) {
      case 'hoje': return data >= inicioHoje;
      case 'ontem': {
        const inicioOntem = new Date(inicioHoje.getTime() - 86400000);
        return data >= inicioOntem && data < inicioHoje;
      }
      case '7dias': return data >= new Date(inicioHoje.getTime() - 7 * 86400000);
      default: return true;
    }
  }

  toggleFiltro(tipo: 'projetos' | 'responsavel' | 'categoria' | 'status', valor: number) {
    const map: Record<string, Set<number>> = {
      projetos: this.filtroProjetos,
      responsavel: this.filtroResponsavel,
      categoria: this.filtroCategoria,
      status: this.filtroStatus,
    };
    const set = map[tipo];
    set.has(valor) ? set.delete(valor) : set.add(valor);
  }

  limparFiltros() {
    this.filtroProjetos.clear();
    this.filtroPeriodo = 'todos';
    this.filtroResponsavel.clear();
    this.filtroCategoria.clear();
    this.filtroStatus.clear();
    this.relatadasPorMim = false;
  }

  constructor(
    public auth: AuthService,
    public theme: ThemeService,
    public notificacaoService: NotificacaoService,
    public chatService: ChatService,
    public callService: CallService,
    public meuDiaService: MeuDiaService,
    private projetoService: ProjetoService,
    private quadroService: QuadroConfiguracaoService,
    private tarefaService: TarefaService,
    private clienteApiService: ClienteApiService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.carregarProjetos();
    this.carregarColegios();
    this.notificacaoService.inicializar();
    this.chatService.inicializar();
    this.callService.inicializar();
    this.meuDiaService.inicializar();

    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      tap(() => {
        this.mostrarDropdown = true;
        const termo = (this.searchControl.value ?? '').trim();
        if (termo.length >= 2) this.carregando = true;
      }),
      switchMap(valor => {
        const termo = (valor ?? '').trim();
        if (termo.length < 2) {
          this.resultados = [];
          this.ultimoTermoApi = '';
          return of([]);
        }

        if (this.resultados.length > 0 && termo.startsWith(this.ultimoTermoApi)) {
          const r = this.resultados.filter(t =>
            t.titulo.toLowerCase().includes(termo) ||
            (t.descricao?.toLowerCase() ?? '').includes(termo)
          );
          return of(r);
        }

        const usuarioId = this.auth.usuario()?.id;
        if (!usuarioId) return of([]);
        this.ultimoTermoApi = termo;
        return this.tarefaService.buscar(termo);
      }),
      finalize(() => this.carregando = false),
    ).subscribe(tarefas => {
      this.resultados = tarefas;
      this.carregando = false;
    });

    this.searchColegiosSub = this.searchControl.valueChanges.pipe(
      debounceTime(150),
      distinctUntilChanged(),
    ).subscribe(valor => this.filtrarColegios((valor ?? '').trim()));
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.searchColegiosSub?.unsubscribe();
  }

  onInputFocus() {
    this.mostrarDropdown = true;
  }

  onInputBlur() {
    setTimeout(() => {
      if (!this.clicouDentro) {
        this.mostrarDropdown = false;
      }
    }, 150);
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDownGlobal(event: MouseEvent) {
    const target = event.target as HTMLElement;
    this.clicouDentro = !!target.closest('.toolbar-search');
  }

  @HostListener('document:click', ['$event'])
  onClickFora(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.toolbar-search')) return;
    this.mostrarDropdown = false;
  }

  fecharDropdown() {
    setTimeout(() => this.mostrarDropdown = false, 150);
  }

  selecionarResultado(tarefa: Tarefa) {
    this.mostrarDropdown = false;
    this.resultados = [];
    this.limparFiltros();
    this.searchControl.setValue('', { emitEvent: false });

    const dialogRef = this.dialog.open(TarefaDetalheModalComponent, {
      width: '1280px',
      maxWidth: '95vw',
      data: { tarefa, membros: [] },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const dto: TarefaSave = {
        titulo: result.titulo,
        descricao: result.descricao,
        status: result.status,
        prioridade: result.prioridade,
        tipo: result.tipo,
        projetoId: tarefa.projetoId,
        responsavelIds: result.responsavelIds || [],
        criadorId: tarefa.criadorId,
        atorId: this.auth.usuario()?.id,
        contatoNome: result.contatoNome ?? null,
        dataEntrega: result.dataEntrega ?? null,
      };
      this.tarefaService.atualizar(tarefa.id, dto).subscribe({
        error: err => console.error('Erro ao salvar:', err),
      });
    });
  }

  statusLabel(status: StatusTarefa): string {
    return STATUS_LABEL[status] || '';
  }

  selecionarColegio(colegio: Cliente) {
    this.mostrarDropdown = false;
    this.resultados = [];
    this.colegiosFiltrados = [];
    this.limparFiltros();
    this.searchControl.setValue('', { emitEvent: false });
    this.router.navigate(['/clientes', colegio.id]);
  }

  carregarProjetos() {
    this.projetoService.listar().subscribe(p => this.projetos = p);
  }

  carregarColegios() {
    this.clienteApiService.listarAtivos().subscribe({
      next: clientes => this.colegios = clientes,
      error: () => this.colegios = [],
    });
  }

  filtrarColegios(termo: string) {
    const buscaNormalizada = normalizarTexto(termo);
    const q = buscaNormalizada;
    if (q.length < 2) {
      this.colegiosFiltrados = [];
      return;
    }
    this.colegiosFiltrados = this.colegios.filter(c =>
      normalizarTexto(c.nome || '').includes(q) ||
      normalizarTexto(c.apelido || '').includes(q) ||
      normalizarTexto(c.contato || '').includes(q) ||
      normalizarTexto(c.telefone || '').includes(q) ||
      normalizarTexto(c.cidade || '').includes(q)
    );
  }

  toggleSidebar() {
    this.sidebarPinned.update(v => !v);
    this.sidebarOpen.set(this.sidebarPinned());
  }

  onHoverZoneEnter() {
    if (!this.sidebarPinned()) {
      this.sidebarOpen.set(true);
    }
  }

  onSidebarLeave() {
    if (!this.sidebarPinned()) {
      this.sidebarOpen.set(false);
    }
  }

  toggleProjetos() {
    this.projetosExpandido.update(v => !v);
  }

  toggleNotificacoes() {
    this.mostrarNotificacoes.update(v => !v);
  }

  navegarNotificacao(notif: Notificacao) {
    if (notif.link) {
      this.mostrarNotificacoes.set(false);
      this.router.navigateByUrl(notif.link);
    }
  }

  aceitarConvite(notif: Notificacao) {
    if (notif.projetoId == null || notif.targetUserId == null) return;
    this.projetoService.aceitarConvite(notif.projetoId, notif.targetUserId).subscribe({
      next: () => {
        this.notificacaoService.alternarLida(notif.id);
        this.carregarProjetos();
      },
      error: () => console.error('Erro ao aceitar convite'),
    });
  }

  recusarConvite(notif: Notificacao) {
    if (notif.projetoId == null || notif.targetUserId == null) return;
    this.projetoService.recusarConvite(notif.projetoId, notif.targetUserId).subscribe({
      next: () => this.notificacaoService.alternarLida(notif.id),
      error: () => console.error('Erro ao recusar convite'),
    });
  }

  @HostListener('document:click', ['$event'])
  fecharNotificacoes(event: MouseEvent) {
    if (this.mostrarNotificacoes()) {
      const target = event.target as HTMLElement;
      if (target.closest('.notificacao-btn') || target.closest('.notificacao-panel')) return;
      this.mostrarNotificacoes.set(false);
    }
  }

  abrirConfiguracoes() {
    this.router.navigate(['/configuracoes']);
  }

  abrirGlobalTaskDialog() {
    const dialogRef = this.dialog.open(GlobalTaskDialogComponent, {
      width: '640px',
      data: { criadorId: this.auth.usuario()!.id },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tarefaService.criar(result).subscribe({
          next: () => this.router.navigate(['/projetos', result.projetoId, 'kanban']),
          error: err => console.error('Erro ao criar tarefa:', err),
        });
      }
    });
  }

  abrirNovoProjeto() {
    const dialogRef = this.dialog.open(ProjetoDialogComponent, {
      width: '580px',
      data: { liderId: this.auth.usuario()!.id },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { quadros, ...projetoData } = result;
        this.projetoService.criar(projetoData as ProjetoSave).subscribe(projeto => {
          if (quadros?.length) {
            this.quadroService.criarParaProjeto(projeto.id, quadros).subscribe(() => this.carregarProjetos());
          } else {
            this.carregarProjetos();
          }
        });
      }
    });
  }
}
