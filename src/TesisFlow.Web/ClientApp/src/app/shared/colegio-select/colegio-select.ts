import { Component, Input, OnInit, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClienteApiService } from '../../features/clientes/cliente-api.service';
import { Cliente } from '../../features/clientes/clientes-data';
import { ColegioRef } from '../../core/models';
import { normalizarTexto } from '../../core/utils/texto.util';

@Component({
  selector: 'app-colegio-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColegioSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './colegio-select.html',
  styleUrl: './colegio-select.scss',
})
export class ColegioSelectComponent implements ControlValueAccessor, OnInit {
  @Input() label = 'Escola';
  @Input() placeholder = 'Buscar escola';
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() hideLabel = false;

  clientes: Cliente[] = [];
  filtrados: Cliente[] = [];
  termo = '';
  selecionado: ColegioRef | null = null;
  disabled = false;

  private onChange = (_: ColegioRef | null) => {};
  private onTouched = () => {};

  marcarTouched(): void {
    this.onTouched();
  }

  private clienteApi = inject(ClienteApiService);

  ngOnInit(): void {
    this.clienteApi.listarAtivos().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        this.filtrados = clientes;
        if (this.selecionado?.nome) this.termo = this.selecionado.nome;
      },
      error: () => {
        this.clientes = [];
        this.filtrados = [];
      },
    });
  }

  onInput(valor: string): void {
    this.termo = valor;
    const q = normalizarTexto(valor);
    this.filtrados = this.clientes.filter(
      (c) => !q || normalizarTexto(c.nome).includes(q) || normalizarTexto(c.apelido || '').includes(q),
    );

    if (!valor || valor.trim().length === 0) {
      this.emit(null);
    }
  }

  onSelecionar(cliente: Cliente): void {
    this.emit({ id: cliente.id, nome: cliente.nome });
    this.termo = cliente.nome;
  }

  limpar(): void {
    this.termo = '';
    this.filtrados = this.clientes;
    this.emit(null);
  }

  private emit(valor: ColegioRef | null): void {
    this.selecionado = valor;
    this.onChange(valor);
    this.onTouched();
  }

  writeValue(valor: ColegioRef | null): void {
    this.selecionado = valor ?? null;
    this.termo = valor?.nome ?? '';
  }

  registerOnChange(fn: (valor: ColegioRef | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
