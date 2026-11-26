import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioAdmin } from '../../core/models';

@Component({
  selector: 'app-admin-configuracoes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatButtonModule, MatInputModule, MatSnackBarModule],
  templateUrl: './admin-configuracoes.html',
  styleUrl: './admin-configuracoes.scss',
})
export class AdminConfiguracoesComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private snackbar = inject(MatSnackBar);

  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  salvandoId = signal<number | null>(null);

  sids: Record<number, string> = {};

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.usuarioService.listarAdmin().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.sids = {};
        for (const u of usuarios) {
          this.sids[u.id] = u.tesisCcSid ?? '';
        }
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.snackbar.open('Não foi possível carregar os usuários.', 'OK', { duration: 4000 });
      },
    });
  }

  salvar(usuario: UsuarioAdmin): void {
    const valor = (this.sids[usuario.id] ?? '').trim();
    this.salvandoId.set(usuario.id);

    this.usuarioService.definirTesisCcSid(usuario.id, valor || null).subscribe({
      next: () => {
        usuario.tesisCcSid = valor || undefined;
        this.sids[usuario.id] = valor;
        this.salvandoId.set(null);
        this.snackbar.open(`SID de ${usuario.nome} salvo.`, 'OK', { duration: 3000 });
      },
      error: () => {
        this.salvandoId.set(null);
        this.snackbar.open('Não foi possível salvar.', 'OK', { duration: 4000 });
      },
    });
  }

  salvando(usuario: UsuarioAdmin): boolean {
    return this.salvandoId() === usuario.id;
  }

  inicial(nome: string): string {
    return nome?.charAt(0).toUpperCase() ?? '?';
  }
}
