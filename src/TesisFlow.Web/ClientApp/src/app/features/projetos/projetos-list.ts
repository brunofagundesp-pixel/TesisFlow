import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ProjetoService } from './projeto.service';
import { QuadroConfiguracaoService } from './quadro-configuracao.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog';
import { Projeto, ProjetoSave } from '../../core/models';
import { ProjetoDialogComponent } from './projeto-dialog';

@Component({
  selector: 'app-projetos-list',
  standalone: true,
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './projetos-list.html',
  styleUrl: './projetos-list.scss',
})
export class ProjetosListComponent implements OnInit {
  projetos: Projeto[] = [];

  constructor(
    private projetoService: ProjetoService,
    private quadroService: QuadroConfiguracaoService,
    public auth: AuthService,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.carregarProjetos();
  }

  carregarProjetos() {
    this.projetoService.listar().subscribe(p => this.projetos = p);
  }

  abrirModal() {
    const dialogRef = this.dialog.open(ProjetoDialogComponent, {
      width: '580px',
      data: { liderId: this.auth.usuario()!.id },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { quadros, ...projetoData } = result;
        this.projetoService.criar(projetoData as ProjetoSave).subscribe(projeto => {
          if (quadros?.length) {
            this.quadroService.criarParaProjeto(projeto.id, quadros).subscribe(() => this.carregarProjetos());
          } else {
            this.carregarProjetos();
          }
        });
      }
    });
  }

  excluirProjeto(event: Event, id: number) {
    event.stopPropagation();
    event.preventDefault();
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Excluir projeto',
        mensagem: 'Todas as tarefas e dados do projeto serao perdidos permanentemente.',
        textoConfirmacao: 'excluir',
      },
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      const email = this.auth.usuario()?.email || '';
      this.projetoService.excluir(id, email).subscribe({
        next: () => this.carregarProjetos(),
        error: err => console.error('Erro ao excluir projeto:', err),
      });
    });
  }
}
