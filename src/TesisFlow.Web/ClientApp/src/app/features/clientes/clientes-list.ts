import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Cliente, STATUS_OPTIONS, CLIENTES_MOCK } from './clientes-data';
import { ClienteApiService } from './cliente-api.service';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
  ],
  templateUrl: './clientes-list.html',
  styleUrl: './clientes-list.scss',
})
export class ClientesListComponent implements OnInit {
  private clienteApiService = inject(ClienteApiService);

  private todosClientes: Cliente[] = CLIENTES_MOCK;

  carregando = signal(true);

  filtroNome = signal('');
  filtroStatus = signal('Todos');
  filtroEstado = signal('Todos');
  filtroCidade = signal('Todos');

  pageIndex = signal(0);
  pageSize = signal(12);
  pageSizeOptions = [12, 24, 48];

  readonly statusOptions = STATUS_OPTIONS;

  readonly estadoOptions = computed(() => {
    const estados = [...new Set(this.todosClientes.map(c => c.estado))].sort();
    return ['Todos', ...estados];
  });

  readonly cidadeOptions = computed(() => {
    const estadoSelecionado = this.filtroEstado();
    const cidades = estadoSelecionado !== 'Todos'
      ? [...new Set(this.todosClientes.filter(c => c.estado === estadoSelecionado).map(c => c.cidade))].sort()
      : [...new Set(this.todosClientes.map(c => c.cidade))].sort();
    return ['Todos', ...cidades];
  });

  readonly clientesFiltrados = computed(() => {
    const nome = this.filtroNome().toLowerCase().trim();
    const status = this.filtroStatus();
    const estado = this.filtroEstado();
    const cidade = this.filtroCidade();

    return this.todosClientes.filter(c => {
      if (nome && !c.nome.toLowerCase().includes(nome) && !c.apelido.toLowerCase().includes(nome)) return false;
      if (status !== 'Todos' && c.status !== status) return false;
      if (estado !== 'Todos' && c.estado !== estado) return false;
      if (cidade !== 'Todos' && c.cidade !== cidade) return false;
      return true;
    });
  });

  readonly clientesPaginados = computed(() => {
    const filtrados = this.clientesFiltrados();
    const start = this.pageIndex() * this.pageSize();
    return filtrados.slice(start, start + this.pageSize());
  });

  readonly totalFiltrados = computed(() => this.clientesFiltrados().length);

  ngOnInit(): void {
    this.clienteApiService.listarAtivos().subscribe({
      next: (clientes) => {
        this.todosClientes = clientes;
        this.carregando.set(false);
      },
      error: () => {
        this.todosClientes = CLIENTES_MOCK;
        this.carregando.set(false);
      },
    });
  }

  onNomeInput(event: Event): void {
    this.filtroNome.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  onEstadoChange(): void {
    this.filtroCidade.set('Todos');
    this.pageIndex.set(0);
  }

  onFiltroChange(): void {
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
}
