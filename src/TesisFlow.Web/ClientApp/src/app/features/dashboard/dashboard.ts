import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TarefaService } from '../tarefas/tarefa.service';
import { AuthService } from '../../core/services/auth.service';
import { TarefaDetalheModalComponent } from '../projetos/tarefa-detalhe-modal';
import { Tarefa, StatusTarefa, TipoTarefa, TarefaSave } from '../../core/models';

interface GrupoProjeto {
  projetoId: number;
  projetoNome: string;
  tarefas: Tarefa[];
}

const STATUS_LABEL: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

const TIPO_ICONE: Record<number, string> = {
  [TipoTarefa.Tarefa]: 'task_alt',
  [TipoTarefa.Bug]: 'bug_report',
  [TipoTarefa.Melhoria]: 'auto_awesome',
  [TipoTarefa.Historia]: 'auto_stories',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  tarefasAgrupadas: GrupoProjeto[] = [];
  carregando = true;

  constructor(
    private tarefaService: TarefaService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) {
      this.carregando = false;
      return;
    }

    this.tarefaService.listarPorResponsavel(usuarioId).subscribe({
      next: tarefas => {
        try {
          const ativas = tarefas.filter(t => t.status !== StatusTarefa.Feito && t.status !== StatusTarefa.Cancelado);
          const map = new Map<number, GrupoProjeto>();
          for (const t of ativas) {
            if (!map.has(t.projetoId)) {
              map.set(t.projetoId, { projetoId: t.projetoId, projetoNome: t.projetoNome, tarefas: [] });
            }
            map.get(t.projetoId)!.tarefas.push(t);
          }
          this.tarefasAgrupadas = Array.from(map.values());
          console.log('tarefasAgrupadas:', this.tarefasAgrupadas);
        } catch (e) {
          console.error('Erro ao processar tarefas:', e);
        }
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar tarefas:', err);
        this.carregando = false;
      }
    });
  }

  statusLabel(s: StatusTarefa): string { return STATUS_LABEL[s] || ''; }
  tipoIcone(t: TipoTarefa): string { return TIPO_ICONE[t] || 'task_alt'; }

  abrirTarefa(tarefa: Tarefa) {
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
      };
      this.tarefaService.atualizar(tarefa.id, dto).subscribe({
        next: () => this.recarregar(),
        error: err => console.error('Erro ao salvar:', err),
      });
    });
  }

  private recarregar() {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) return;
    this.carregando = true;
    this.tarefaService.listarPorResponsavel(usuarioId).subscribe({
      next: tarefas => {
        const ativas = tarefas.filter(t => t.status !== StatusTarefa.Feito && t.status !== StatusTarefa.Cancelado);
        const map = new Map<number, GrupoProjeto>();
        for (const t of ativas) {
          if (!map.has(t.projetoId)) map.set(t.projetoId, { projetoId: t.projetoId, projetoNome: t.projetoNome, tarefas: [] });
          map.get(t.projetoId)!.tarefas.push(t);
        }
        this.tarefasAgrupadas = Array.from(map.values());
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: () => this.carregando = false,
    });
  }
}
