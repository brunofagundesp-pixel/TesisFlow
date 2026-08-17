import { Component, Input, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaService } from './categoria.service';
import { Categoria } from '../../core/models';
import { CategoriaFormDialogComponent } from './categoria-form-dialog';
import { ExcluirCategoriaDialogComponent } from './excluir-categoria-dialog';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class CategoriasComponent implements OnInit, OnChanges {
  @Input() projetoId!: number;

  categorias: Categoria[] = [];
  carregando = true;
  erro = '';

  private categoriaService = inject(CategoriaService);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.carregar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projetoId'] && !changes['projetoId'].firstChange) {
      this.carregar();
    }
  }

  carregar(): void {
    if (!this.projetoId) return;
    this.carregando = true;
    this.erro = '';
    this.categoriaService.listarPorProjeto(this.projetoId).subscribe({
      next: c => {
        this.categorias = c;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Erro ao carregar categorias.';
        this.carregando = false;
      },
    });
  }

  corComOpacidade(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  nova(): void {
    const ref = this.dialog.open(CategoriaFormDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe(r => {
      if (r) this.categoriaService.criar(this.projetoId, r).subscribe(() => this.carregar());
    });
  }

  editar(c: Categoria): void {
    const ref = this.dialog.open(CategoriaFormDialogComponent, {
      width: '420px',
      data: { id: c.id, nome: c.nome, icone: c.icone, cor: c.cor },
    });
    ref.afterClosed().subscribe(r => {
      if (r) this.categoriaService.atualizar(c.id, r).subscribe(() => this.carregar());
    });
  }

  excluir(c: Categoria): void {
    const ref = this.dialog.open(ExcluirCategoriaDialogComponent, {
      width: '480px',
      data: { categoria: c, categorias: this.categorias },
    });
    ref.afterClosed().subscribe(resultado => {
      if (resultado == null) return;
      const novaId = typeof resultado === 'number' ? resultado : undefined;
      this.categoriaService.excluir(c.id, novaId).subscribe(() => this.carregar());
    });
  }
}
