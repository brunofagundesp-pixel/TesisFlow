import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ProjetoService } from './projeto.service';
import { CategoriasComponent } from '../categorias/categorias';

@Component({
  selector: 'app-projeto-configuracoes',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, CategoriasComponent],
  templateUrl: './projeto-configuracoes.html',
  styleUrl: './projeto-configuracoes.scss',
})
export class ProjetoConfiguracoesComponent implements OnInit {
  projetoId!: number;
  projetoNome = '';

  private route = inject(ActivatedRoute);
  private projetoService = inject(ProjetoService);

  ngOnInit(): void {
    this.projetoId = Number(this.route.snapshot.paramMap.get('id'));
    this.projetoService.obter(this.projetoId).subscribe(p => this.projetoNome = p.nome);
  }
}
