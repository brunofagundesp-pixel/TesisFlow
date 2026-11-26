import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import {
  AtendimentoCrm, AtendimentoCrmPayload, EscolaCrm, EscolaCrmPayload, EscolaCrmResumo,
  STATUS_ATENDIMENTO_OPTIONS, KANBAN_ETAPAS,
  statusAtendimentoLabel, statusAtendimentoClasse, resultadoLabel, tipoInteracaoLabel, etapaLabel, etapaClasse,
} from './crm-data';
import { CrmService } from './crm.service';
import { AtendimentoCrmDialogComponent } from './atendimento-crm-dialog';
import { EncerrarOportunidadeDialogComponent } from './encerrar-oportunidade-dialog';
import { AdicionarEscolaPipelineDialogComponent } from './adicionar-escola-pipeline-dialog';
import { ConfirmarSimplesDialogComponent } from '../../shared/confirmar-simples-dialog';
import { AuthService } from '../../core/services/auth.service';
import { Cliente } from '../clientes/clientes-data';

@Component({
  selector: 'app-crm-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSnackBarModule,
    DatePipe,
  ],
  templateUrl: './crm-list.html',
  styleUrl: './crm-list.scss',
})
export class CrmListComponent implements OnInit {
  private crmService = inject(CrmService);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);
  private auth = inject(AuthService);

  readonly statusOptions = STATUS_ATENDIMENTO_OPTIONS;
  readonly kanbanEtapas = KANBAN_ETAPAS;

  aba = signal<'atendimentos' | 'retornos' | 'pipeline'>('atendimentos');

  atendimentos = signal<AtendimentoCrm[]>([]);
  total = signal(0);
  carregando = signal(true);

  retornos = signal<AtendimentoCrm[]>([]);
  retornosCarregando = signal(false);

  resumo = signal<EscolaCrmResumo | null>(null);
  escolasCrm = signal<EscolaCrm[]>([]);
  pipelineCarregando = signal(false);

  filtroBusca = signal('');
  filtroStatus = signal<number | null>(null);

  pageIndex = signal(0);
  pageSize = signal(20);
  pageSizeOptions = [10, 20, 50];

  private buscaTimer: any;
  private arrastandoId: number | null = null;

  ngOnInit(): void {
    this.carregar();
    this.carregarRetornos();
    this.carregarResumo();
  }

  carregar(): void {
    this.carregando.set(true);
    this.crmService.listar(
      {
        busca: this.filtroBusca().trim() || undefined,
        status: this.filtroStatus() ?? undefined,
      },
      this.pageSize(),
      this.pageIndex() * this.pageSize(),
    ).subscribe({
      next: (res) => {
        this.atendimentos.set(res.itens);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: () => {
        this.atendimentos.set([]);
        this.total.set(0);
        this.carregando.set(false);
      },
    });
  }

  carregarRetornos(): void {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) return;

    this.retornosCarregando.set(true);
    this.crmService.listarRetornos(usuarioId).subscribe({
      next: (retornos) => {
        this.retornos.set(retornos);
        this.retornosCarregando.set(false);
      },
      error: () => {
        this.retornos.set([]);
        this.retornosCarregando.set(false);
      },
    });
  }

  carregarResumo(): void {
    this.crmService.obterResumo().subscribe({
      next: (resumo) => this.resumo.set(resumo),
      error: () => this.resumo.set(null),
    });
  }

  carregarPipeline(): void {
    this.pipelineCarregando.set(true);
    this.crmService.listarEscolasCrm().subscribe({
      next: (escolas) => {
        this.escolasCrm.set(escolas);
        this.pipelineCarregando.set(false);
      },
      error: () => {
        this.escolasCrm.set([]);
        this.pipelineCarregando.set(false);
      },
    });
    this.carregarResumo();
  }

  selecionarAba(aba: 'atendimentos' | 'retornos' | 'pipeline'): void {
    this.aba.set(aba);
    if (aba === 'retornos') this.carregarRetornos();
    if (aba === 'pipeline') this.carregarPipeline();
  }

  onBusca(event: Event): void {
    this.filtroBusca.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => this.carregar(), 400);
  }

  onStatusChange(): void {
    this.pageIndex.set(0);
    this.carregar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }

  novo(): void {
    this.abrirDialog(null);
  }

  editar(a: AtendimentoCrm): void {
    this.abrirDialog(a);
  }

  private abrirDialog(a: AtendimentoCrm | null): void {
    const ref = this.dialog.open(AtendimentoCrmDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      data: { atendimento: a },
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.carregar();
        this.carregarRetornos();
        this.carregarResumo();
      }
    });
  }

  excluir(a: AtendimentoCrm): void {
    const ref = this.dialog.open(ConfirmarSimplesDialogComponent, {
      width: '400px',
      maxWidth: '92vw',
      data: { titulo: 'Excluir atendimento', mensagem: `Excluir "${a.titulo}"?`, textoBotao: 'Excluir' },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.crmService.excluir(a.id).subscribe({
          next: () => {
            this.carregar();
            this.carregarRetornos();
          },
          error: () => this.snackbar.open('Não foi possível excluir.', 'OK', { duration: 4000 }),
        });
      }
    });
  }

  registrarRetorno(a: AtendimentoCrm): void {
    const ref = this.dialog.open(AtendimentoCrmDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      data: { origem: a },
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.carregar();
        this.carregarRetornos();
        this.carregarResumo();
      }
    });
  }

  concluirRetorno(a: AtendimentoCrm): void {
    const ref = this.dialog.open(ConfirmarSimplesDialogComponent, {
      width: '400px',
      maxWidth: '92vw',
      data: {
        titulo: 'Concluir retorno',
        mensagem: `Marcar o retorno com "${a.colegioNome}" como concluído?`,
        textoBotao: 'Concluir',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.crmService.atualizar(a.id, this.toAtendimentoPayload(a, true)).subscribe({
          next: () => this.carregarRetornos(),
          error: () => this.snackbar.open('Não foi possível concluir.', 'OK', { duration: 4000 }),
        });
      }
    });
  }

  private toAtendimentoPayload(a: AtendimentoCrm, retornoConcluido: boolean): AtendimentoCrmPayload {
    return {
      colegioId: a.colegioId,
      colegioNome: a.colegioNome,
      titulo: a.titulo,
      descricao: a.descricao,
      status: a.status,
      nomeContato: a.nomeContato,
      tipoInteracao: a.tipoInteracao,
      canal: a.canal,
      resultado: a.resultado,
      contatoId: a.contatoId,
      atendimentoOrigemId: a.atendimentoOrigemId,
      proximoContatoData: a.proximoContatoData,
      proximoContatoHora: a.proximoContatoHora,
      proximoContatoMotivo: a.proximoContatoMotivo,
      retornoConcluido,
    };
  }

  private classificarRetorno(a: AtendimentoCrm): 'atrasado' | 'hoje' | 'proximos' {
    if (!a.proximoContatoData) return 'proximos';
    const data = new Date(a.proximoContatoData);
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimHoje = new Date(inicioHoje.getTime() + 86400000);
    if (data < inicioHoje) return 'atrasado';
    if (data < fimHoje) return 'hoje';
    return 'proximos';
  }

  readonly retornosAtrasados = computed(() => this.retornos().filter(a => this.classificarRetorno(a) === 'atrasado'));
  readonly retornosHoje = computed(() => this.retornos().filter(a => this.classificarRetorno(a) === 'hoje'));
  readonly retornosProximos = computed(() => this.retornos().filter(a => this.classificarRetorno(a) === 'proximos'));

  escolasPorEtapa(etapa: number): EscolaCrm[] {
    return this.escolasCrm().filter(e => e.etapaComercial === etapa);
  }

  get encerradas(): EscolaCrm[] {
    return this.escolasCrm().filter(e => e.etapaComercial === 6 || e.etapaComercial === 7);
  }

  adicionarEscolaPipeline(): void {
    const ref = this.dialog.open(AdicionarEscolaPipelineDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((c: Cliente | undefined) => {
      if (!c) return;

      const payload: EscolaCrmPayload = {
        colegioId: c.id,
        colegioNome: c.nome,
        etapaComercial: 0,
        responsavelId: null,
        responsavelNome: null,
        contatoPrincipalId: null,
        contatoPrincipalNome: null,
        motivoEncerramento: null,
        motivoObservacao: null,
        dataConversao: null,
      };

      this.crmService.criarEscolaCrm(payload).subscribe({
        next: () => this.carregarPipeline(),
        error: () => this.snackbar.open('Não foi possível adicionar a escola.', 'OK', { duration: 4000 }),
      });
    });
  }

  private toEscolaPayload(escola: EscolaCrm, patch: Partial<EscolaCrmPayload>): EscolaCrmPayload {
    return {
      colegioId: escola.colegioId,
      colegioNome: escola.colegioNome,
      etapaComercial: escola.etapaComercial,
      responsavelId: escola.responsavelId,
      responsavelNome: escola.responsavelNome,
      contatoPrincipalId: escola.contatoPrincipalId,
      contatoPrincipalNome: escola.contatoPrincipalNome,
      motivoEncerramento: escola.motivoEncerramento,
      motivoObservacao: escola.motivoObservacao,
      dataConversao: escola.dataConversao,
      ...patch,
    };
  }

  private moverParaEtapa(escola: EscolaCrm, etapa: number): void {
    if (etapa === 5) {
      const ref = this.dialog.open(ConfirmarSimplesDialogComponent, {
        width: '400px',
        maxWidth: '92vw',
        data: {
          titulo: 'Cliente conquistado',
          mensagem: `Confirmar "${escola.colegioNome}" como cliente conquistado?`,
          textoBotao: 'Confirmar',
        },
      });

      ref.afterClosed().subscribe((ok) => {
        if (ok) {
          const payload = this.toEscolaPayload(escola, { etapaComercial: 5, dataConversao: new Date().toISOString() });
          this.crmService.atualizarEscolaCrm(escola.id, payload).subscribe(() => this.carregarPipeline());
        }
      });
      return;
    }

    const payload = this.toEscolaPayload(escola, { etapaComercial: etapa });
    this.crmService.atualizarEscolaCrm(escola.id, payload).subscribe(() => this.carregarPipeline());
  }

  encerrar(escola: EscolaCrm): void {
    const ref = this.dialog.open(EncerrarOportunidadeDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res: { etapa: number; motivo: string; observacao: string | null } | undefined) => {
      if (!res) return;
      const payload = this.toEscolaPayload(escola, {
        etapaComercial: res.etapa,
        motivoEncerramento: res.motivo,
        motivoObservacao: res.observacao,
      });
      this.crmService.atualizarEscolaCrm(escola.id, payload).subscribe(() => this.carregarPipeline());
    });
  }

  reabrir(escola: EscolaCrm): void {
    const payload = this.toEscolaPayload(escola, {
      etapaComercial: 2,
      motivoEncerramento: null,
      motivoObservacao: null,
    });
    this.crmService.atualizarEscolaCrm(escola.id, payload).subscribe(() => this.carregarPipeline());
  }

  onDragStart(event: DragEvent, escola: EscolaCrm): void {
    this.arrastandoId = escola.id;
    event.dataTransfer?.setData('text/plain', String(escola.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDrop(event: DragEvent, etapa: number): void {
    event.preventDefault();
    const id = Number(event.dataTransfer?.getData('text/plain'));
    if (!id) return;
    const escola = this.escolasCrm().find(e => e.id === id);
    if (!escola || escola.etapaComercial === etapa) return;
    this.moverParaEtapa(escola, etapa);
  }

  statusLabel(status: number): string {
    return statusAtendimentoLabel(status);
  }

  statusClasse(status: number): string {
    return statusAtendimentoClasse(status);
  }

  resultadoLabel(r: number | null): string {
    return resultadoLabel(r);
  }

  tipoLabel(t: number | null): string {
    return tipoInteracaoLabel(t);
  }

  etapaLabel(e: number): string {
    return etapaLabel(e);
  }

  etapaClasse(e: number): string {
    return etapaClasse(e);
  }
}
