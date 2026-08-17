import { Component, Input, OnInit, OnChanges, SimpleChanges, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CategoriaService } from './categoria.service';
import { Categoria } from '../../core/models';
import { CategoriaFormDialogComponent } from './categoria-form-dialog';

@Component({
  selector: 'app-categoria-select',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CategoriaSelectComponent), multi: true },
  ],
  templateUrl: './categoria-select.html',
  styleUrl: './categoria-select.scss',
})
export class CategoriaSelectComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() projetoId: number | null = null;

  categorias: Categoria[] = [];
  valor: number | null = null;
  disabled = false;

  private onChange = (_: number | null) => {};
  private onTouched = () => {};

  private categoriaService = inject(CategoriaService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  ngOnInit(): void {
    this.carregar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projetoId'] && !changes['projetoId'].firstChange) {
      this.carregar();
    }
  }

  carregar(): void {
    if (this.projetoId == null) {
      this.categorias = [];
      return;
    }
    this.categoriaService.listarPorProjeto(this.projetoId).subscribe(c => {
      this.categorias = c;
      if (c.length > 0 && !c.some(x => x.id === this.valor)) {
        this.valor = c[0].id;
        this.onChange(c[0].id);
      }
    });
  }

  get selecionada(): Categoria | undefined {
    return this.categorias.find(c => c.id === this.valor);
  }

  selecionar(c: Categoria): void {
    this.valor = c.id;
    this.onChange(c.id);
    this.onTouched();
  }

  editar(): void {
    const alvo = this.selecionada;
    if (!alvo) return;
    const ref = this.dialog.open(CategoriaFormDialogComponent, {
      width: '420px',
      data: { id: alvo.id, nome: alvo.nome, icone: alvo.icone, cor: alvo.cor },
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.categoriaService.atualizar(alvo.id, r).subscribe(() => this.carregar());
    });
  }

  adicionar(): void {
    if (this.projetoId == null) return;
    const ref = this.dialog.open(CategoriaFormDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe(r => {
      if (r) {
        this.categoriaService.criar(this.projetoId!, r).subscribe(nova => {
          this.carregar();
          this.valor = nova.id;
          this.onChange(nova.id);
        });
      }
    });
  }

  gerenciar(): void {
    if (this.projetoId != null) {
      this.router.navigate(['/projetos', this.projetoId, 'configuracoes']);
    }
  }

  writeValue(v: number | null): void {
    this.valor = v ?? null;
  }

  registerOnChange(fn: (v: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
