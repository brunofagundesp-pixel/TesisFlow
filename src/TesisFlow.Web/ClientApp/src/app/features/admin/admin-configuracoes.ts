import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioAdmin } from '../../core/models';
import { ConfirmarSimplesDialogComponent } from '../../shared/confirmar-simples-dialog';

@Component({
  selector: 'app-admin-configuracoes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatIconModule, MatButtonModule, MatInputModule, MatTabsModule, MatSnackBarModule],
  templateUrl: './admin-configuracoes.html',
  styleUrl: './admin-configuracoes.scss',
})
export class AdminConfiguracoesComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  usuarios = signal<UsuarioAdmin[]>([]);
  carregando = signal(true);
  salvandoId = signal<number | null>(null);
  salvandoCargoId = signal<number | null>(null);
  criando = signal(false);
  excluindoId = signal<number | null>(null);

  sids: Record<number, string> = {};
  cargos: Record<number, string> = {};
  novoUsuario = { nome: '', email: '', senha: '', cargo: '' };

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.usuarioService.listarAdmin().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.sids = {};
        this.cargos = {};
        for (const u of usuarios) {
          this.sids[u.id] = u.tesisCcSid ?? '';
          this.cargos[u.id] = u.cargo ?? '';
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

  criarUsuario(): void {
    const nome = this.novoUsuario.nome.trim();
    const email = this.novoUsuario.email.trim();
    const senha = this.novoUsuario.senha;
    const cargo = this.novoUsuario.cargo.trim();

    if (!nome || !email || !senha) {
      this.snackbar.open('Preencha nome, email e senha.', 'OK', { duration: 4000 });
      return;
    }
    if (senha.length < 6) {
      this.snackbar.open('A senha deve ter no mínimo 6 caracteres.', 'OK', { duration: 4000 });
      return;
    }

    this.criando.set(true);
    this.usuarioService.criar({ nome, email, senha, cargo: cargo || undefined }).subscribe({
      next: () => {
        this.novoUsuario = { nome: '', email: '', senha: '', cargo: '' };
        this.criando.set(false);
        this.snackbar.open('Usuário cadastrado.', 'OK', { duration: 3000 });
        this.carregar();
      },
      error: (e: any) => {
        this.criando.set(false);
        this.snackbar.open(e.error?.mensagem || 'Não foi possível cadastrar.', 'OK', { duration: 4000 });
      },
    });
  }

  salvarCargo(usuario: UsuarioAdmin): void {
    const valor = (this.cargos[usuario.id] ?? '').trim();
    this.salvandoCargoId.set(usuario.id);

    this.usuarioService.definirCargo(usuario.id, valor || null).subscribe({
      next: () => {
        usuario.cargo = valor || undefined;
        this.cargos[usuario.id] = valor;
        this.salvandoCargoId.set(null);
        this.snackbar.open(`Cargo de ${usuario.nome} salvo.`, 'OK', { duration: 3000 });
      },
      error: (e: any) => {
        this.salvandoCargoId.set(null);
        this.snackbar.open(e.error?.mensagem || 'Não foi possível salvar o cargo.', 'OK', { duration: 4000 });
      },
    });
  }

  excluir(usuario: UsuarioAdmin): void {
    const ref = this.dialog.open(ConfirmarSimplesDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Inativar usuário',
        mensagem: `Deseja inativar "${usuario.nome}"? O usuário perderá o acesso ao sistema.`,
        textoBotao: 'Inativar',
        cor: 'warn',
      },
    });

    ref.afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;

      this.excluindoId.set(usuario.id);
      this.usuarioService.excluir(usuario.id).subscribe({
        next: () => {
          this.excluindoId.set(null);
          this.snackbar.open('Usuário inativado.', 'OK', { duration: 3000 });
          this.carregar();
        },
        error: () => {
          this.excluindoId.set(null);
          this.snackbar.open('Não foi possível inativar.', 'OK', { duration: 4000 });
        },
      });
    });
  }

  salvando(usuario: UsuarioAdmin): boolean {
    return this.salvandoId() === usuario.id;
  }

  salvandoCargo(usuario: UsuarioAdmin): boolean {
    return this.salvandoCargoId() === usuario.id;
  }

  excluindo(usuario: UsuarioAdmin): boolean {
    return this.excluindoId() === usuario.id;
  }

  inicial(nome: string): string {
    return nome?.charAt(0).toUpperCase() ?? '?';
  }
}
