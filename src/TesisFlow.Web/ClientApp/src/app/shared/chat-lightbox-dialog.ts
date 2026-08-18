import { Component, Inject, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-lightbox-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule],
  template: `
    <div class="lightbox" (click)="fechar()">
      <div class="lightbox-barra" (click)="$event.stopPropagation()">
        <span class="lightbox-nome">{{ data.nome || 'Imagem' }}</span>
        <div class="lightbox-acoes">
          <button class="lightbox-btn" (click)="baixar()" title="Baixar">
            <mat-icon>download</mat-icon>
          </button>
          <button class="lightbox-btn" (click)="fechar()" title="Fechar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>
      <img class="lightbox-img" [src]="data.src" alt="" (click)="$event.stopPropagation()" />
    </div>
  `,
  styles: [`
    .lightbox {
      position: relative;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .lightbox-barra {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      z-index: 1;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(6px);
    }

    .lightbox-nome {
      flex: 1;
      min-width: 0;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lightbox-acoes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .lightbox-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      cursor: pointer;
      transition: background 0.1s;

      &:hover { background: rgba(255, 255, 255, 0.28); }

      mat-icon { font-size: 1.3rem; width: 1.3rem; height: 1.3rem; }
    }

    .lightbox-img {
      max-width: 92vw;
      max-height: 86vh;
      object-fit: contain;
      border-radius: 8px;
      margin-top: 3rem;
    }
  `],
})
export class ChatLightboxDialogComponent {
  private dialogRef = inject(MatDialogRef<ChatLightboxDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { src: string; nome: string }) {}

  fechar(): void {
    this.dialogRef.close();
  }

  baixar(): void {
    const url = this.data.src.includes('?')
      ? `${this.data.src}&download=1`
      : `${this.data.src}?download=1`;

    const a = document.createElement('a');
    a.href = url;
    a.download = this.data.nome || '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
