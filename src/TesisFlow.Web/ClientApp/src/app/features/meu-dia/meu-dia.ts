import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TarefaService } from '../tarefas/tarefa.service';
import { MeuDiaService } from '../../core/services/meu-dia.service';
import { AuthService } from '../../core/services/auth.service';
import { TarefaDetalheSidebarComponent } from './tarefa-detalhe-sidebar';
import { Tarefa, StatusTarefa, PrioridadeTarefa, TarefaSave } from '../../core/models';

const STATUS_LABEL: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

const PRIORIDADE_LABEL: Record<number, string> = {
  [PrioridadeTarefa.Baixa]: 'Baixa',
  [PrioridadeTarefa.Media]: 'Media',
  [PrioridadeTarefa.Alta]: 'Alta',
  [PrioridadeTarefa.Critica]: 'Critica',
};

@Component({
  selector: 'app-meu-dia',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, TarefaDetalheSidebarComponent],
  templateUrl: './meu-dia.html',
  styleUrl: './meu-dia.scss',
})
export class MeuDiaComponent implements OnInit {
  readonly StatusTarefa = StatusTarefa;

  statusMenu: Tarefa | null = null;
  statusMenuPos = { top: 0, left: 0 };
  prioridadeMenu: Tarefa | null = null;
  prioridadeMenuPos = { top: 0, left: 0 };
  tarefaSelecionada: Tarefa | null = null;

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

  constructor(
    public meuDiaService: MeuDiaService,
    private tarefaService: TarefaService,
    private snackbar: MatSnackBar,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.meuDiaService.inicializar();
  }

  temMeuDia(tarefa: Tarefa): boolean {
    return this.meuDiaService.tem(tarefa.id);
  }

  alternarMeuDia(tarefa: Tarefa): void {
    this.meuDiaService.alternar(tarefa).subscribe({
      error: () => this.snackbar.open('Não foi possível atualizar o Meu dia.', 'OK', { duration: 3000 }),
    });
  }

  statusLabel(s: StatusTarefa): string { return STATUS_LABEL[s] || ''; }

  prioridadeLabel(p: PrioridadeTarefa): string { return PRIORIDADE_LABEL[p] || 'Media'; }

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

  prioridadeIcone(p: PrioridadeTarefa): string {
    const icones: Record<number, string> = {
      [PrioridadeTarefa.Baixa]: 'arrow_downward',
      [PrioridadeTarefa.Media]: 'drag_handle',
      [PrioridadeTarefa.Alta]: 'arrow_upward',
      [PrioridadeTarefa.Critica]: 'priority_high',
    };
    return icones[p] || 'drag_handle';
  }

  toggleStatusMenu(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    this.prioridadeMenu = null;
    if (this.statusMenu?.id === tarefa.id) {
      this.statusMenu = null;
      return;
    }
    this.statusMenu = tarefa;
    const el = (event.target as HTMLElement).closest('.mini-status') ?? (event.target as HTMLElement);
    const rect = el.getBoundingClientRect();
    this.statusMenuPos = { top: rect.bottom + 6, left: rect.left - 90 };
  }

  togglePrioridadeMenu(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    this.statusMenu = null;
    if (this.prioridadeMenu?.id === tarefa.id) {
      this.prioridadeMenu = null;
      return;
    }
    this.prioridadeMenu = tarefa;
    const el = (event.target as HTMLElement).closest('.mini-prioridade') ?? (event.target as HTMLElement);
    const rect = el.getBoundingClientRect();
    this.prioridadeMenuPos = { top: rect.bottom + 6, left: rect.left - 90 };
  }

  @HostListener('document:click', ['$event'])
  fecharMenus(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.mini-status') || target.closest('.status-dropdown')) return;
    this.statusMenu = null;
    if (target.closest('.mini-prioridade') || target.closest('.prioridade-dropdown')) return;
    this.prioridadeMenu = null;
  }

  alterarStatus(tarefa: Tarefa, status: StatusTarefa) {
    if (tarefa.status === status) return;
    this.tarefaService.mover({ id: tarefa.id, status, ordem: tarefa.ordem, usuarioId: this.auth.usuario()?.id }).subscribe({
      next: () => this.meuDiaService.recarregar(),
      error: () => this.snackbar.open('Não foi possível alterar o status.', 'OK', { duration: 3000 }),
    });
  }

  alterarPrioridade(tarefa: Tarefa, prioridade: PrioridadeTarefa) {
    if (tarefa.prioridade === prioridade) return;
    const dto: TarefaSave = {
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      status: tarefa.status,
      prioridade,
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
      next: () => this.meuDiaService.recarregar(),
      error: () => this.snackbar.open('Não foi possível alterar a prioridade.', 'OK', { duration: 3000 }),
    });
  }

  abrirTarefa(tarefa: Tarefa) {
    this.tarefaSelecionada = tarefa;
  }

  fecharSidebar() {
    this.tarefaSelecionada = null;
  }

  onTarefaAlterada() {
    this.meuDiaService.recarregar();
    if (this.tarefaSelecionada) {
      const atualizada = this.meuDiaService.tarefas().find(t => t.id === this.tarefaSelecionada!.id);
      if (!atualizada) {
        this.tarefaSelecionada = null;
      }
    }
  }
}
