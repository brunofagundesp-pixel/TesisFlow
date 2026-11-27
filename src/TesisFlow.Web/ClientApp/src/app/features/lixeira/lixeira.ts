import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { TarefaService } from '../tarefas/tarefa.service';
import { AuthService } from '../../core/services/auth.service';
import { Tarefa, StatusTarefa } from '../../core/models';

const STATUS_LABEL: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

@Component({
  selector: 'app-lixeira',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, DatePipe],
  templateUrl: './lixeira.html',
  styleUrl: './lixeira.scss',
})
export class LixeiraComponent implements OnInit {
  tarefas: Tarefa[] = [];
  carregando = true;

  constructor(
    public auth: AuthService,
    private tarefaService: TarefaService,
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) return;

    this.carregando = true;
    this.tarefaService.listarLixeira().subscribe({
      next: (tarefas) => {
        this.tarefas = tarefas;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      },
    });
  }

  restaurar(t: Tarefa): void {
    this.tarefaService.restaurar(t.id).subscribe({
      next: () => this.carregar(),
    });
  }

  excluirDefinitivamente(t: Tarefa): void {
    if (!confirm('Excluir definitivamente esta tarefa? Esta ação não pode ser desfeita.')) return;
    this.tarefaService.excluirDefinitivamente(t.id).subscribe({
      next: () => this.carregar(),
    });
  }

  statusLabel(s: StatusTarefa): string {
    return STATUS_LABEL[s] || '';
  }

  diasRestantes(dataExclusao?: string): number {
    if (!dataExclusao) return 30;
    const excluida = new Date(dataExclusao).getTime();
    const limite = excluida + 30 * 24 * 60 * 60 * 1000;
    const dias = Math.ceil((limite - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, dias);
  }
}
