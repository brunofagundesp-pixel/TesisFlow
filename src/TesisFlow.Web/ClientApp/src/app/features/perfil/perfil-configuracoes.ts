import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { AuthUrlPipe } from '../../core/auth-url';
import { UsuarioService } from '../../core/services/usuario.service';
import { FotoCropDialogComponent } from './foto-crop-dialog';

@Component({
  selector: 'app-perfil-configuracoes',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule, AuthUrlPipe],
  templateUrl: './perfil-configuracoes.html',
  styleUrl: './perfil-configuracoes.scss',
})
export class PerfilConfiguracoesComponent {
  auth = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private snackbar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  carregando = false;

  get usuario() {
    return this.auth.usuario();
  }

  selecionarArquivo(): void {
    this.fileInput.nativeElement.click();
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) return;
    if (!this.usuario) return;

    if (!arquivo.type.startsWith('image/')) {
      this.snackbar.open('Selecione um arquivo de imagem.', 'OK', { duration: 3000 });
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      this.snackbar.open('A foto deve ter no máximo 5MB.', 'OK', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dialogRef = this.dialog.open(FotoCropDialogComponent, {
        width: '440px',
        maxWidth: '95vw',
        disableClose: true,
        data: { imagem: reader.result as string },
      });

      dialogRef.afterClosed().subscribe((blob: Blob | undefined) => {
        if (!blob) return;
        const foto = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
        this.enviarFoto(foto);
      });
    };
    reader.readAsDataURL(arquivo);
  }

  private enviarFoto(arquivo: File): void {
    if (!this.usuario) return;

    this.carregando = true;
    this.usuarioService.atualizarFoto(this.usuario.id, arquivo).subscribe({
      next: usuario => {
        this.auth.atualizarUsuario(usuario);
        this.carregando = false;
        this.snackbar.open('Foto atualizada com sucesso.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.carregando = false;
        this.snackbar.open('Não foi possível atualizar a foto.', 'OK', { duration: 3000 });
      },
    });
  }

  removerFoto(): void {
    if (!this.usuario || !this.usuario.foto) return;

    this.carregando = true;
    this.usuarioService.removerFoto(this.usuario.id).subscribe({
      next: usuario => {
        this.auth.atualizarUsuario(usuario);
        this.carregando = false;
        this.snackbar.open('Foto removida.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.carregando = false;
        this.snackbar.open('Não foi possível remover a foto.', 'OK', { duration: 3000 });
      },
    });
  }
}
