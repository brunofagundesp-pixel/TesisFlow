import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { SlicePipe, DatePipe } from '@angular/common';
import {
  Cliente, Atendimento, DiarioEntry, PortalAlunoEntry, FinanceiroEntry,
  CLIENTES_MOCK,
} from './clientes-data';
import { ClienteApiService, ColegioNota } from './cliente-api.service';
import { AtendimentoDialogComponent } from './atendimento-dialog';
import { CrmService } from '../crm/crm.service';
import {
  AtendimentoCrm, EscolaCrm,
  statusAtendimentoLabel, statusAtendimentoClasse,
  tipoInteracaoLabel, canalLabel, resultadoLabel, etapaLabel, etapaClasse,
} from '../crm/crm-data';
import { AtendimentoCrmDialogComponent } from '../crm/atendimento-crm-dialog';
import { ConfirmarSimplesDialogComponent } from '../../shared/confirmar-simples-dialog';

interface TabDef {
  label: string;
  icon: string;
}

const ITENS_POR_VEZ = 20;
const NOTAS_POR_VEZ = 8;

const NOTA_CORES = [
  { valor: '', rotulo: 'Padrão' },
  { valor: '#F28B82', rotulo: 'Vermelho' },
  { valor: '#FBBC04', rotulo: 'Laranja' },
  { valor: '#FFF475', rotulo: 'Amarelo' },
  { valor: '#CCFF90', rotulo: 'Verde' },
  { valor: '#CBF0F8', rotulo: 'Azul' },
  { valor: '#D7AEFB', rotulo: 'Roxo' },
  { valor: '#E8EAED', rotulo: 'Cinza' },
];

const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

@Component({
  selector: 'app-cliente-detalhe',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    SlicePipe,
    DatePipe,
  ],
  templateUrl: './cliente-detalhe.html',
  styleUrl: './cliente-detalhe.scss',
})
export class ClienteDetalheComponent implements OnInit {
  cliente: Cliente = CLIENTES_MOCK[0];

  carregando = signal(true);
  tabIndex = signal(0);
  mostrarSenha = signal(false);
  headerExpandido = signal(false);

  readonly notaCores = NOTA_CORES;

  notas = signal<ColegioNota[]>([]);
  totalNotas = signal(0);
  notasCarregando = signal(false);

  criandoNota = signal(false);
  novaNotaTitulo = signal('');
  novaNotaConteudo = signal('');
  novaNotaCor = signal('');

  editandoNotaId = signal<number | null>(null);
  editNotaTitulo = signal('');
  editNotaConteudo = signal('');
  editNotaCor = signal('');

  confirmandoExclusaoId = signal<number | null>(null);

  itensVisiveisAtendimento = signal(ITENS_POR_VEZ);
  itensVisiveisDiario = signal(ITENS_POR_VEZ);
  itensVisiveisFinanceiro = signal(ITENS_POR_VEZ);

  readonly tabs: TabDef[] = [
    { label: 'Atendimentos', icon: 'headset_mic' },
    { label: 'Notas', icon: 'sticky_note_2' },
    { label: 'Diario', icon: 'menu_book' },
    { label: 'Portal do Aluno', icon: 'school' },
    { label: 'Portal Admin', icon: 'admin_panel_settings' },
    { label: 'Financeiro', icon: 'payments' },
    { label: 'CRM', icon: 'support_agent' },
  ];

  filtroAtendimentoDescricao = signal('');
  filtroAtendimentoProtocolo = signal('');
  filtroAtendimentoUsuario = signal('Todos');

  filtroDiarioNome = signal('');
  filtroDiarioId = signal('');

  filtroPortalNomeUsuario = signal('');
  filtroPortalLogin = signal('');
  filtroPortalTipoUsuario = signal('Todos');

  filtroPortalAdminNomeUsuario = signal('');
  filtroPortalAdminLogin = signal('');

  filtroFinanceiroStatus = signal('Todos');
  filtroFinanceiroAno = signal(new Date().getFullYear().toString());
  filtroFinanceiroMes = signal(MESES[new Date().getMonth()]);

  atendimentosMock: Atendimento[] = [];
  diarioMock: DiarioEntry[] = [];
  portalAlunoMock: PortalAlunoEntry[] = [];
  portalAlunoAdminMock: PortalAlunoEntry[] = [];
  financeiroMock: FinanceiroEntry[] = [];

  atendimentosCrm = signal<AtendimentoCrm[]>([]);
  totalAtendimentosCrm = signal(0);
  atendimentosCrmCarregando = signal(false);
  escolaCrm = signal<EscolaCrm | null>(null);

  readonly tipoUsuarioOptions = ['Todos', 'Aluno', 'Responsavel', 'Professor'];
  readonly statusFinanceiroOptions = ['Todos', 'Pago', 'Pendente', 'Atrasado', 'Cancelado'];
  readonly mesOptions = ['Todos', ...MESES];

  readonly usuariosAtendimentoOptions = computed(() => {
    const usuarios = [...new Set(this.atendimentosMock.map(a => a.usuario))].sort();
    return ['Todos', ...usuarios];
  });

  readonly tabCounts = computed(() => [
    this.atendimentosMock.length,
    this.totalNotas(),
    this.diarioMock.length,
    this.portalAlunoMock.length,
    this.portalAlunoAdminMock.length,
    this.financeiroMock.length,
    this.totalAtendimentosCrm(),
  ]);

  constructor(private route: ActivatedRoute) {}

  private clienteApiService = inject(ClienteApiService);
  private crmService = inject(CrmService);
  private dialog = inject(MatDialog);

  private colegioId = 0;
  private notaSaveTimer: any;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.colegioId = id;

    this.clienteApiService.obterPorId(id).subscribe({
      next: (cliente) => {
        this.cliente = cliente || CLIENTES_MOCK[0];
        this.carregarTudo(id);
      },
      error: (err) => {
        console.error('Erro ao carregar cliente:', err);
        this.cliente = CLIENTES_MOCK[0];
        this.carregarTudo(id);
      },
    });

    this.sincronizarParceirosEcarregar();
  }

  private sincronizarParceirosEcarregar(): void {
    this.clienteApiService.sincronizarParceiros(this.colegioId).subscribe({
      next: () => this.carregarNotas(),
      error: () => this.carregarNotas(),
    });
  }

  private carregarTudo(id: number): void {
    this.carregarDadosMockFallback();

    const diarioBase = this.cliente.idTesis || this.cliente.codigoPortalAluno;
    const idTesisRaw = this.cliente.codigoPortalAluno || this.cliente.idTesis;
    const idTesis = idTesisRaw ? idTesisRaw.padStart(15, '0') : '';
    const diarioFromTesis = diarioBase ? parseInt(diarioBase.substring(0, 8), 10).toString() : null;
    const diarioId = this.cliente.codigoDiario || this.cliente.idDiarioRaw || diarioFromTesis;

    let pendentes = 1; // atendimentos
    if (diarioId) pendentes += 2; // senha + professores
    if (idTesis) pendentes += 3; // app + portal aluno + portal admin
    pendentes += 1; // parcelas

    let concluidas = 0;
    const verificarConclusao = () => {
      concluidas++;
      if (concluidas >= pendentes) {
        this.carregando.set(false);
      }
    };

    this.clienteApiService.getAtendimentos(id).subscribe({
      next: (data) => { this.atendimentosMock = data; verificarConclusao(); },
      error: () => verificarConclusao(),
    });

    if (diarioId) {
      this.clienteApiService.getSenhaDiario(diarioId).subscribe({
        next: (senha) => { this.cliente = { ...this.cliente, senhaMasterDiario: senha }; verificarConclusao(); },
        error: () => verificarConclusao(),
      });

      this.clienteApiService.getProfessores(diarioId, 2026).subscribe({
        next: (data) => { this.diarioMock = data; verificarConclusao(); },
        error: () => verificarConclusao(),
      });
    }

    if (idTesis) {
      this.clienteApiService.getCodigosApp(idTesis).subscribe({
        next: (app) => {
          this.cliente = { ...this.cliente, codigoAplicativo: app.codigoAplicativo, apelidoAplicativo: app.apelidoAplicativo };
          verificarConclusao();
        },
        error: () => verificarConclusao(),
      });

      this.clienteApiService.getPortalAlunoUsuarios(idTesis).subscribe({
        next: (data) => { this.portalAlunoMock = data; verificarConclusao(); },
        error: () => verificarConclusao(),
      });

      this.clienteApiService.getPortalAlunoAdministradores(idTesis).subscribe({
        next: (data) => { this.portalAlunoAdminMock = data; verificarConclusao(); },
        error: () => verificarConclusao(),
      });
    }

    this.clienteApiService.getParcelas(id).subscribe({
      next: (data) => { this.financeiroMock = data; verificarConclusao(); },
      error: () => verificarConclusao(),
    });

    this.carregarAtendimentosCrm();
  }

  selecionarTab(index: number): void {
    this.tabIndex.set(index);
  }

  toggleSenha(): void {
    this.mostrarSenha.update(v => !v);
  }

  toggleHeader(): void {
    this.headerExpandido.update(v => !v);
  }

  private ordenarNotas(lista: ColegioNota[]): ColegioNota[] {
    return [...lista].sort((a, b) => {
      if (a.fixa !== b.fixa) return a.fixa ? -1 : 1;
      if (a.fixa) {
        const da = a.dataFixacao ? new Date(a.dataFixacao).getTime() : 0;
        const db = b.dataFixacao ? new Date(b.dataFixacao).getTime() : 0;
        return db - da;
      }
      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
    });
  }

  get temMaisNotas(): boolean {
    return this.notas().length < this.totalNotas();
  }

  private carregarNotas(): void {
    if (this.notasCarregando()) return;

    this.notasCarregando.set(true);
    this.clienteApiService.getNotas(this.colegioId, NOTAS_POR_VEZ, 0).subscribe({
      next: (res) => {
        this.notas.set(this.ordenarNotas(res.itens));
        this.totalNotas.set(res.total);
        this.notasCarregando.set(false);
      },
      error: () => this.notasCarregando.set(false),
    });
  }

  carregarMaisNotas(): void {
    if (!this.temMaisNotas || this.notasCarregando()) return;

    this.notasCarregando.set(true);
    this.clienteApiService.getNotas(this.colegioId, NOTAS_POR_VEZ, this.notas().length).subscribe({
      next: (res) => {
        this.notas.set(this.ordenarNotas([...this.notas(), ...res.itens]));
        this.totalNotas.set(res.total);
        this.notasCarregando.set(false);
      },
      error: () => this.notasCarregando.set(false),
    });
  }

  abrirCriarNota(): void {
    this.novaNotaTitulo.set('');
    this.novaNotaConteudo.set('');
    this.novaNotaCor.set('');
    this.criandoNota.set(true);
  }

  cancelarCriarNota(): void {
    this.criandoNota.set(false);
  }

  salvarNovaNota(): void {
    const titulo = this.novaNotaTitulo().trim();
    const conteudo = this.novaNotaConteudo().trim();
    if (!titulo && !conteudo) {
      this.criandoNota.set(false);
      return;
    }

    this.clienteApiService.criarNota({
      colegioId: this.colegioId,
      titulo,
      conteudo,
      cor: this.novaNotaCor(),
      fixa: false,
    }).subscribe(nota => {
      this.notas.set(this.ordenarNotas([nota, ...this.notas()]));
      this.totalNotas.update(v => v + 1);
      this.criandoNota.set(false);
    });
  }

  ehNotaParceiro(nota: ColegioNota): boolean {
    return !!nota.parceiroId;
  }

  editarNota(nota: ColegioNota): void {
    this.editandoNotaId.set(nota.id);
    this.editNotaTitulo.set(nota.titulo);
    this.editNotaConteudo.set(nota.conteudo);
    this.editNotaCor.set(nota.cor);
  }

  cancelarEdicao(): void {
    this.editandoNotaId.set(null);
    clearTimeout(this.notaSaveTimer);
  }

  onNotaEditChange(): void {
    clearTimeout(this.notaSaveTimer);
    this.notaSaveTimer = setTimeout(() => this.salvarEdicao(), 800);
  }

  private salvarEdicao(): void {
    const id = this.editandoNotaId();
    if (!id) return;

    const atual = this.notas().find(n => n.id === id);
    if (!atual) return;

    this.clienteApiService.atualizarNota(id, {
      titulo: this.editNotaTitulo(),
      conteudo: this.editNotaConteudo(),
      cor: this.editNotaCor(),
      fixa: atual.fixa,
    }).subscribe(nota => {
      this.notas.update(lista => this.ordenarNotas(lista.map(n => n.id === id ? nota : n)));
    });
  }

  alternarFixa(nota: ColegioNota): void {
    this.clienteApiService.atualizarNota(nota.id, {
      titulo: nota.titulo,
      conteudo: nota.conteudo,
      cor: nota.cor,
      fixa: !nota.fixa,
    }).subscribe(atualizada => {
      this.notas.update(lista => this.ordenarNotas(lista.map(n => n.id === atualizada.id ? atualizada : n)));
    });
  }

  pedirExcluirNota(id: number): void {
    this.confirmandoExclusaoId.set(id);
  }

  cancelarExclusao(): void {
    this.confirmandoExclusaoId.set(null);
  }

  confirmarExclusaoNota(id: number): void {
    this.clienteApiService.excluirNota(id).subscribe(() => {
      this.notas.update(lista => lista.filter(n => n.id !== id));
      this.totalNotas.update(v => Math.max(0, v - 1));
      this.confirmandoExclusaoId.set(null);
      if (this.editandoNotaId() === id) this.cancelarEdicao();
    });
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  ehChaveTarefa(protocolo: string): boolean {
    return /^[A-Z]{2,4}-\d+$/.test((protocolo || '').trim());
  }

  get codigoColegio(): string {
    return (this.cliente.idTesis || '').replace(/^0+/, '').slice(0, 7);
  }

  linkProfessor(d: DiarioEntry): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}-${pad(now.getMinutes())}-${now.getSeconds()}`;
    const senha = this.cliente.senhaMasterDiario || d.senha;
    const plain = `${this.codigoColegio}:${d.id}:${senha}:${timestamp}`;
    return `https://professor.tesis.inf.br/#/login/${encodeURIComponent(this.cripta(plain))}`;
  }

  private cripta(plain: string): string {
    const chave = 'hbjSDHaYa9uu4MB1Ft5ur2kpwXF9MXg5UTioeClU';
    let dados = '';
    let j = 0;
    for (let i = 0; i < plain.length; i++) {
      j++;
      const kc = j < chave.length ? chave.charCodeAt(j) : 0;
      let l = plain.charCodeAt(i) + kc;
      if (j === 50) j = 1;
      if (l > 255) l -= 256;
      dados += String.fromCharCode(l);
    }
    return dados;
  }

  abrirAtendimento(atendimento: Atendimento): void {
    const dialogRef = this.dialog.open(AtendimentoDialogComponent, {
      width: '880px',
      data: { atendimento, idColegio: this.cliente.id },
    });

    dialogRef.afterClosed().subscribe((result: Atendimento | undefined) => {
      if (result) {
        const index = this.atendimentosMock.findIndex(a => a.id === result.id);
        if (index >= 0) {
          this.atendimentosMock[index] = result;
          this.atendimentosMock = [...this.atendimentosMock];
        }
      }
    });
  }

  private carregarAtendimentosCrm(): void {
    if (this.atendimentosCrmCarregando()) return;

    this.atendimentosCrmCarregando.set(true);
    this.crmService.listarPorColegio(this.colegioId, 50, 0).subscribe({
      next: (res) => {
        this.atendimentosCrm.set(res.itens);
        this.totalAtendimentosCrm.set(res.total);
        this.atendimentosCrmCarregando.set(false);
      },
      error: () => this.atendimentosCrmCarregando.set(false),
    });

    this.carregarEscolaCrm();
  }

  private carregarEscolaCrm(): void {
    this.crmService.obterEscolaCrmPorColegio(this.colegioId).subscribe({
      next: (escola) => this.escolaCrm.set(escola),
      error: () => this.escolaCrm.set(null),
    });
  }

  carregarMaisAtendimentosCrm(): void {
    if (!this.temMaisCrm || this.atendimentosCrmCarregando()) return;

    this.atendimentosCrmCarregando.set(true);
    this.crmService.listarPorColegio(this.colegioId, 50, this.atendimentosCrm().length).subscribe({
      next: (res) => {
        this.atendimentosCrm.update(lista => [...lista, ...res.itens]);
        this.totalAtendimentosCrm.set(res.total);
        this.atendimentosCrmCarregando.set(false);
      },
      error: () => this.atendimentosCrmCarregando.set(false),
    });
  }

  get temMaisCrm(): boolean {
    return this.atendimentosCrm().length < this.totalAtendimentosCrm();
  }

  novoAtendimentoCrm(): void {
    const ref = this.dialog.open(AtendimentoCrmDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { colegioId: this.colegioId, colegioNome: this.cliente.nome },
    });

    ref.afterClosed().subscribe((res) => {
      if (res) this.carregarAtendimentosCrm();
    });
  }

  editarAtendimentoCrm(a: AtendimentoCrm): void {
    const ref = this.dialog.open(AtendimentoCrmDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { atendimento: a },
    });

    ref.afterClosed().subscribe((res) => {
      if (res) this.carregarAtendimentosCrm();
    });
  }

  excluirAtendimentoCrm(a: AtendimentoCrm): void {
    const ref = this.dialog.open(ConfirmarSimplesDialogComponent, {
      width: '400px',
      maxWidth: '92vw',
      data: {
        titulo: 'Excluir atendimento',
        mensagem: `Excluir "${a.titulo}"?`,
        textoBotao: 'Excluir',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.crmService.excluir(a.id).subscribe({
          next: () => this.carregarAtendimentosCrm(),
          error: () => console.error('Erro ao excluir atendimento'),
        });
      }
    });
  }

  statusLabelCrm(status: number): string {
    return statusAtendimentoLabel(status);
  }

  statusClasseCrm(status: number): string {
    return statusAtendimentoClasse(status);
  }

  etapaLabelCrm(etapa: number): string {
    return etapaLabel(etapa);
  }

  etapaClasseCrm(etapa: number): string {
    return etapaClasse(etapa);
  }

  tipoLabelCrm(t: number | null): string {
    return tipoInteracaoLabel(t);
  }

  canalLabelCrm(c: number | null): string {
    return canalLabel(c);
  }

  resultadoLabelCrm(r: number | null): string {
    return resultadoLabel(r);
  }

  private carregarDadosMockFallback(): void {
    this.portalAlunoMock = [
      { id: 1, nomeUsuario: 'Lucas Oliveira', login: '123.456.789-00', tipoUsuario: 'Aluno', ativo: true },
      { id: 2, nomeUsuario: 'Mariana Santos', login: '987.654.321-00', tipoUsuario: 'Aluno', ativo: true },
      { id: 3, nomeUsuario: 'Sra. Claudia', login: '456.789.123-00', tipoUsuario: 'Responsavel', ativo: true },
      { id: 4, nomeUsuario: 'Rafael Costa', login: 'PRONT-2024001', tipoUsuario: 'Aluno', ativo: false },
      { id: 5, nomeUsuario: 'Sr. Fernando', login: '789.123.456-00', tipoUsuario: 'Responsavel', ativo: true },
    ];
  }

  readonly atendimentosFiltrados = computed(() => {
    const desc = this.filtroAtendimentoDescricao().toLowerCase().trim();
    const proto = this.filtroAtendimentoProtocolo().toLowerCase().trim();
    const usuario = this.filtroAtendimentoUsuario();
    return this.atendimentosMock.filter(a => {
      if (desc && !a.titulo.toLowerCase().includes(desc) && !a.descricao.toLowerCase().includes(desc)) return false;
      if (proto && !a.protocolo.toLowerCase().includes(proto)) return false;
      if (usuario !== 'Todos' && a.usuario !== usuario) return false;
      return true;
    });
  });

  readonly atendimentosVisiveis = computed(() => {
    return this.atendimentosFiltrados().slice(0, this.itensVisiveisAtendimento());
  });

  readonly temMaisAtendimentos = computed(() => {
    return this.itensVisiveisAtendimento() < this.atendimentosFiltrados().length;
  });

  carregarMaisAtendimento(): void {
    this.itensVisiveisAtendimento.update(v => v + ITENS_POR_VEZ);
  }

  atendimentoFilterChange(): void {
    this.itensVisiveisAtendimento.set(ITENS_POR_VEZ);
  }

  readonly diarioFiltrados = computed(() => {
    const nome = this.filtroDiarioNome().toLowerCase().trim();
    const idStr = this.filtroDiarioId().trim();
    return this.diarioMock.filter(d => {
      if (nome && !d.nome.toLowerCase().includes(nome)) return false;
      if (idStr && d.id !== idStr) return false;
      return true;
    });
  });

  readonly diarioVisiveis = computed(() => {
    return this.diarioFiltrados().slice(0, this.itensVisiveisDiario());
  });

  readonly temMaisDiario = computed(() => {
    return this.itensVisiveisDiario() < this.diarioFiltrados().length;
  });

  carregarMaisDiario(): void {
    this.itensVisiveisDiario.update(v => v + ITENS_POR_VEZ);
  }

  diarioFilterChange(): void {
    this.itensVisiveisDiario.set(ITENS_POR_VEZ);
  }

  readonly portalAlunoFiltrados = computed(() => {
    const nome = this.filtroPortalNomeUsuario().toLowerCase().trim();
    const login = this.filtroPortalLogin().toLowerCase().trim();
    const tipo = this.filtroPortalTipoUsuario();
    return this.portalAlunoMock.filter(p => {
      if (nome && !p.nomeUsuario.toLowerCase().includes(nome)) return false;
      if (login && !p.login.toLowerCase().includes(login)) return false;
      if (tipo !== 'Todos' && p.tipoUsuario !== tipo) return false;
      return true;
    });
  });

  readonly portalAlunoAdminFiltrados = computed(() => {
    const nome = this.filtroPortalAdminNomeUsuario().toLowerCase().trim();
    const login = this.filtroPortalAdminLogin().toLowerCase().trim();
    return this.portalAlunoAdminMock.filter(p => {
      if (nome && !p.nomeUsuario.toLowerCase().includes(nome)) return false;
      if (login && !p.login.toLowerCase().includes(login)) return false;
      return true;
    });
  });

  readonly financeiroFiltrados = computed(() => {
    const status = this.filtroFinanceiroStatus();
    const ano = this.filtroFinanceiroAno().trim();
    const mes = this.filtroFinanceiroMes();
    return this.financeiroMock.filter(f => {
      if (status !== 'Todos' && f.statusParcela !== status) return false;
      if (ano && f.ano.toString() !== ano) return false;
      if (mes !== 'Todos' && f.mes !== mes) return false;
      return true;
    });
  });

  readonly financeiroVisiveis = computed(() => {
    return this.financeiroFiltrados().slice(0, this.itensVisiveisFinanceiro());
  });

  readonly temMaisFinanceiro = computed(() => {
    return this.itensVisiveisFinanceiro() < this.financeiroFiltrados().length;
  });

  carregarMaisFinanceiro(): void {
    this.itensVisiveisFinanceiro.update(v => v + ITENS_POR_VEZ);
  }

  financeiroFilterChange(): void {
    this.itensVisiveisFinanceiro.set(ITENS_POR_VEZ);
  }

  onTabScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
    if (!nearBottom) return;

    const tab = this.tabIndex();
    if (tab === 0 && this.temMaisAtendimentos()) this.carregarMaisAtendimento();
    else if (tab === 1 && this.temMaisNotas) this.carregarMaisNotas();
    else if (tab === 2 && this.temMaisDiario()) this.carregarMaisDiario();
    else if (tab === 5 && this.temMaisFinanceiro()) this.carregarMaisFinanceiro();
    else if (tab === 6 && this.temMaisCrm) this.carregarMaisAtendimentosCrm();
  }
}
