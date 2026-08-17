import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { TarefaService } from '../../features/tarefas/tarefa.service';
import { Tarefa, StatusTarefa } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class MeuDiaService {
  private _tarefas = signal<Tarefa[]>([]);
  readonly tarefas = computed(() => {
    const naoCanceladas = this._tarefas().filter(t => t.status !== StatusTarefa.Cancelado);
    const pendentes = naoCanceladas.filter(t => t.status !== StatusTarefa.Feito);
    const concluidas = naoCanceladas.filter(t => t.status === StatusTarefa.Feito);
    return [...pendentes, ...concluidas];
  });
  readonly ids = computed(() => new Set(this.tarefas().map(t => t.id)));
  readonly count = computed(() => this.tarefas().length);
  private carregado = false;

  constructor(private auth: AuthService, private tarefaService: TarefaService) {}

  inicializar(): void {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId || this.carregado) return;

    this.carregado = true;
    this.tarefaService.listarMeuDiaTarefas(usuarioId).subscribe(tarefas => {
      this._tarefas.set(tarefas);
    });
  }

  reiniciar(): void {
    this.carregado = false;
    this._tarefas.set([]);
    this.inicializar();
  }

  recarregar(): void {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) return;
    this.tarefaService.listarMeuDiaTarefas(usuarioId).subscribe(tarefas => {
      this._tarefas.set(tarefas);
    });
  }

  tem(tarefaId: number): boolean {
    return this.ids().has(tarefaId);
  }

  alternar(tarefa: Tarefa): Observable<{ ativo: boolean }> {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) return new Observable();

    const ativo = this.ids().has(tarefa.id);
    const atual = this._tarefas();
    if (ativo) {
      this._tarefas.set(atual.filter(t => t.id !== tarefa.id));
    } else {
      this._tarefas.set([...atual.filter(t => t.id !== tarefa.id), tarefa]);
    }

    return this.tarefaService.alternarMeuDia(tarefa.id, usuarioId).pipe(
      tap({
        error: () => {
          const revertido = this._tarefas();
          if (ativo) {
            this._tarefas.set([...revertido, tarefa]);
          } else {
            this._tarefas.set(revertido.filter(t => t.id !== tarefa.id));
          }
        },
      }),
    );
  }
}
