import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { SlicePipe } from '@angular/common';
import {
  Cliente, Atendimento, DiarioEntry, PortalAlunoEntry, FinanceiroEntry,
  CLIENTES_MOCK,
} from './clientes-data';
import { ClienteApiService } from './cliente-api.service';
import { AtendimentoDialogComponent } from './atendimento-dialog';

interface TabDef {
  label: string;
  icon: string;
}

const ITENS_POR_VEZ = 20;

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

  itensVisiveisAtendimento = signal(ITENS_POR_VEZ);
  itensVisiveisDiario = signal(ITENS_POR_VEZ);
  itensVisiveisFinanceiro = signal(ITENS_POR_VEZ);

  readonly tabs: TabDef[] = [
    { label: 'Atendimentos', icon: 'headset_mic' },
    { label: 'Diario', icon: 'menu_book' },
    { label: 'Portal do Aluno', icon: 'school' },
    { label: 'Portal Admin', icon: 'admin_panel_settings' },
    { label: 'Financeiro', icon: 'payments' },
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
  filtroFinanceiroMes = signal('Todos');

  atendimentosMock: Atendimento[] = [];
  diarioMock: DiarioEntry[] = [];
  portalAlunoMock: PortalAlunoEntry[] = [];
  portalAlunoAdminMock: PortalAlunoEntry[] = [];
  financeiroMock: FinanceiroEntry[] = [];

  readonly tipoUsuarioOptions = ['Todos', 'Aluno', 'Responsavel', 'Professor'];
  readonly statusFinanceiroOptions = ['Todos', 'Pago', 'Pendente', 'Atrasado', 'Cancelado'];
  readonly mesOptions = ['Todos', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  readonly usuariosAtendimentoOptions = computed(() => {
    const usuarios = [...new Set(this.atendimentosMock.map(a => a.usuario))].sort();
    return ['Todos', ...usuarios];
  });

  readonly tabCounts = computed(() => [
    this.atendimentosMock.length,
    this.diarioMock.length,
    this.portalAlunoMock.length,
    this.portalAlunoAdminMock.length,
    this.financeiroMock.length,
  ]);

  constructor(private route: ActivatedRoute) {}

  private clienteApiService = inject(ClienteApiService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

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
  }

  private carregarTudo(id: number): void {
    this.carregarDadosMockFallback();

    const idTesisRaw = this.cliente.idTesis || this.cliente.codigoPortalAluno;
    const idTesis = idTesisRaw && !idTesisRaw.startsWith('0') ? '0' + idTesisRaw : idTesisRaw;
    const diarioFromTesis = idTesisRaw ? parseInt(idTesisRaw.substring(0, 8), 10).toString() : null;
    const diarioId = this.cliente.codigoDiario || this.cliente.idDiarioRaw || diarioFromTesis;

    let pendentes = 1; // atendimentos
    if (diarioId) pendentes += 2; // senha + professores
    if (idTesis) pendentes += 1; // app
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
    }

    this.clienteApiService.getParcelas(id).subscribe({
      next: (data) => { this.financeiroMock = data; verificarConclusao(); },
      error: () => verificarConclusao(),
    });
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

  formatarData(data: string): string {
    if (!data) return '-';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  abrirAtendimento(atendimento: Atendimento): void {
    const dialogRef = this.dialog.open(AtendimentoDialogComponent, {
      width: '880px',
      data: { atendimento },
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
    else if (tab === 1 && this.temMaisDiario()) this.carregarMaisDiario();
    else if (tab === 4 && this.temMaisFinanceiro()) this.carregarMaisFinanceiro();
  }
}
