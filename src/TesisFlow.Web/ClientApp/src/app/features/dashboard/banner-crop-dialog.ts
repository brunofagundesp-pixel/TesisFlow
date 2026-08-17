import { Component, Inject, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Cropper from 'cropperjs';

@Component({
  selector: 'app-banner-crop-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './banner-crop-dialog.html',
  styleUrl: './banner-crop-dialog.scss',
})
export class BannerCropDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('imagem') imagemRef!: ElementRef<HTMLImageElement>;
  @ViewChild('preview') previewRef!: ElementRef<HTMLDivElement>;

  processando = false;
  private cropper?: Cropper;

  constructor(
    private dialogRef: MatDialogRef<BannerCropDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string; aspectRatio: number },
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.iniciarCropper(), 60);
  }

  ngOnDestroy(): void {
    this.cropper?.destroy();
  }

  iniciarCropper(): void {
    if (this.cropper) return;
    const img = this.imagemRef?.nativeElement;
    if (!img) return;

    this.cropper = new Cropper(img, {
      aspectRatio: this.data.aspectRatio,
      viewMode: 1,
      autoCropArea: 1,
      dragMode: 'move',
      background: false,
      checkCrossOrigin: false,
      preview: this.previewRef?.nativeElement,
    });
  }

  salvar(): void {
    if (!this.cropper || this.processando) return;
    this.processando = true;

    const canvas = this.cropper.getCroppedCanvas({ maxWidth: 2400 });
    canvas.toBlob(
      blob => {
        this.processando = false;
        this.dialogRef.close(blob);
      },
      'image/jpeg',
      0.9,
    );
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
