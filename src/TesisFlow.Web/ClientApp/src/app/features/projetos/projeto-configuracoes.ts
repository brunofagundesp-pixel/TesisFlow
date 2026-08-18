import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjetoService } from './projeto.service';
import { CategoriasComponent } from '../categorias/categorias';
import { IconPickerComponent } from '../categorias/icon-picker';
import { ProjetoMembroDialogComponent } from './projeto-membro-dialog';
import { Projeto, ProjetoMembro } from '../../core/models';

@Component({
  selector: 'app-projeto-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    CategoriasComponent,
    IconPickerComponent,
  ],
  templateUrl: './projeto-configuracoes.html',
  styleUrl: './projeto-configuracoes.scss',
})
export class ProjetoConfiguracoesComponent implements OnInit {
  projetoId!: number;
  projetoNome = '';
  projeto?: Projeto;
  cor = '#ff8615';
  liderId = 0;
  secaoAtiva: 'informacoes' | 'tipos' | 'participantes' = 'informacoes';
  salvo = false;

  form: FormGroup;

  private route = inject(ActivatedRoute);
  private projetoService = inject(ProjetoService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackbar = inject(MatSnackBar);

  constructor() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(200)]],
      descricao: ['', Validators.maxLength(2000)],
      icone: ['folder'],
    });
  }

  ngOnInit(): void {
    this.projetoId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar(): void {
    this.projetoService.obter(this.projetoId).subscribe(p => {
      this.projeto = p;
      this.projetoNome = p.nome;
      this.cor = p.cor || '#ff8615';
      this.liderId = p.liderId;
      this.form.patchValue({
        nome: p.nome,
        descricao: p.descricao || '',
        icone: p.icone || 'folder',
      });
    });
  }

  get membros(): ProjetoMembro[] {
    return this.projeto?.membros ?? [];
  }

  get convites(): ProjetoMembro[] {
    return this.projeto?.convites ?? [];
  }

  convidar(): void {
    const dialogRef = this.dialog.open(ProjetoMembroDialogComponent, {
      width: '420px',
      data: { projetoId: this.projetoId, projetoNome: this.projetoNome },
    });

    dialogRef.afterClosed().subscribe(email => {
      if (email) {
        this.projetoService.convidarMembro(this.projetoId, email).subscribe({
          next: () => this.carregar(),
          error: () => this.snackbar.open('Não foi possível convidar o usuário.', 'OK', { duration: 3000 }),
        });
      }
    });
  }

  onIcone(i: { icone: string; cor: string }) {
    this.form.patchValue({ icone: i.icone });
    this.cor = i.cor;
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.projetoService.atualizar(this.projetoId, {
      nome: this.form.value.nome,
      descricao: this.form.value.descricao,
      cor: this.cor,
      icone: this.form.value.icone,
      liderId: this.liderId,
    }).subscribe(() => {
      this.projetoNome = this.form.value.nome;
      this.salvo = true;
      setTimeout(() => this.salvo = false, 2000);
    });
  }
}
