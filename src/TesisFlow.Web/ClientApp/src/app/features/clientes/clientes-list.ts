import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cliente } from './clientes-data';
import { ClienteApiService } from './cliente-api.service';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSnackBarModule,
  ],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
})
export class ClientesListComponent implements OnInit {
  private clienteApiService = inject(ClienteApiService);
  private snackbar = inject(MatSnackBar);

  clientes = signal<Cliente[]>([]);
  total = signal(0);
  carregando = signal(true);
  exportando = signal(false);

  filtroNome = signal('');
  filtroSituacao = signal('CLIENTE ATIVO');
  filtroEstado = signal('Todos');
  filtroCidade = signal('Todos');

  pageIndex = signal(0);
  pageSize = signal(48);
  pageSizeOptions = [12, 24, 48];

  readonly situacaoOptions = signal<string[]>(['Todos', 'CLIENTE ATIVO']);
  readonly estadoOptions = signal<string[]>(['Todos']);
  readonly cidadeOptions = signal<string[]>(['Todos']);

  private cidadesPorEstado: Record<string, string[]> = {};
  private buscaTimer: any;

  ngOnInit(): void {
    this.clienteApiService.listarSituacoes().subscribe({
      next: (situacoes) => {
        const demais = situacoes.filter(s => s !== 'CLIENTE ATIVO');
        this.situacaoOptions.set(['Todos', 'CLIENTE ATIVO', ...demais]);
      },
    });

    this.clienteApiService.listarFiltros().subscribe({
      next: (filtros) => {
        this.cidadesPorEstado = filtros.cidadesPorEstado ?? {};
        this.estadoOptions.set(['Todos', ...(filtros.estados ?? [])]);
      },
    });

    this.carregar();
  }

  private montarFiltros() {
    return {
      situacao: this.filtroSituacao(),
      busca: this.filtroNome().trim() || undefined,
      uf: this.filtroEstado() !== 'Todos' ? this.filtroEstado() : undefined,
      municipio: this.filtroCidade() !== 'Todos' ? this.filtroCidade() : undefined,
    };
  }

  private carregar(): void {
    this.carregando.set(true);

    this.clienteApiService.listarPaginado(this.montarFiltros(), this.pageSize(), this.pageIndex() * this.pageSize()).subscribe({
      next: (res) => {
        this.clientes.set(res.items);
        this.total.set(res.total);
        this.carregando.set(false);
      },
      error: () => {
        this.clientes.set([]);
        this.total.set(0);
        this.carregando.set(false);
      },
    });
  }

  exportar(): void {
    if (this.exportando()) return;

    this.exportando.set(true);
    this.clienteApiService.exportar(this.montarFiltros()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'escolas.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.exportando.set(false);
        this.snackbar.open('Exportação concluída.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.exportando.set(false);
        this.snackbar.open('Não foi possível exportar.', 'OK', { duration: 3000 });
      },
    });
  }

  onNomeInput(event: Event): void {
    this.filtroNome.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
    clearTimeout(this.buscaTimer);
    this.buscaTimer = setTimeout(() => this.carregar(), 400);
  }

  onEstadoChange(): void {
    const estado = this.filtroEstado();
    this.filtroCidade.set('Todos');
    this.cidadeOptions.set(['Todos', ...(this.cidadesPorEstado[estado] ?? [])]);
    this.pageIndex.set(0);
    this.carregar();
  }

  onFiltroChange(): void {
    this.pageIndex.set(0);
    this.carregar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }
}
