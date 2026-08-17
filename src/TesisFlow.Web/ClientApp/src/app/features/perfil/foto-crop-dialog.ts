import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FotoCropData {
  imagem: string;
}

const CROP_SIZE = 320;
const OUTPUT_SIZE = 512;
const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 4;

@Component({
  selector: 'app-foto-crop-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './foto-crop-dialog.html',
  styleUrl: './foto-crop-dialog.scss',
})
export class FotoCropDialogComponent {
  private dialogRef = inject(MatDialogRef<FotoCropDialogComponent>);
  data = inject<FotoCropData>(MAT_DIALOG_DATA);

  @ViewChild('fotoImg') fotoImg!: ElementRef<HTMLImageElement>;

  pronto = false;
  salvando = false;

  imgW = 0;
  imgH = 0;
  escalaMinima = 1;
  escala = 1;
  fatorZoom = 1;
  tx = 0;
  ty = 0;

  private arrastando = false;
  private inicioX = 0;
  private inicioY = 0;
  private inicioTx = 0;
  private inicioTy = 0;

  get transform(): string {
    return `translate(${this.tx}px, ${this.ty}px) scale(${this.escala})`;
  }

  onLoad(): void {
    const img = this.fotoImg.nativeElement;
    this.imgW = img.naturalWidth;
    this.imgH = img.naturalHeight;

    if (!this.imgW || !this.imgH) return;

    this.escalaMinima = CROP_SIZE / Math.min(this.imgW, this.imgH);
    this.fatorZoom = 1;
    this.escala = this.escalaMinima;
    this.centralizar();
    this.pronto = true;
  }

  centralizar(): void {
    this.tx = (CROP_SIZE - this.imgW * this.escala) / 2;
    this.ty = (CROP_SIZE - this.imgH * this.escala) / 2;
  }

  recentrar(): void {
    this.fatorZoom = 1;
    this.escala = this.escalaMinima;
    this.centralizar();
  }

  onFatorZoomChange(valor: number): void {
    const novo = Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, valor));

    const cx = (CROP_SIZE / 2 - this.tx) / this.escala;
    const cy = (CROP_SIZE / 2 - this.ty) / this.escala;

    this.fatorZoom = novo;
    this.escala = this.escalaMinima * novo;
    this.tx = CROP_SIZE / 2 - cx * this.escala;
    this.ty = CROP_SIZE / 2 - cy * this.escala;

    this.clamp();
  }

  onWheel(event: WheelEvent): void {
    if (!this.pronto) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    this.onFatorZoomChange(this.fatorZoom + delta);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.pronto) return;
    this.arrastando = true;
    this.inicioX = event.clientX;
    this.inicioY = event.clientY;
    this.inicioTx = this.tx;
    this.inicioTy = this.ty;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.arrastando) return;
    this.tx = this.inicioTx + (event.clientX - this.inicioX);
    this.ty = this.inicioTy + (event.clientY - this.inicioY);
    this.clamp();
  }

  onPointerUp(): void {
    this.arrastando = false;
  }

  private clamp(): void {
    const larguraExibida = this.imgW * this.escala;
    const alturaExibida = this.imgH * this.escala;

    this.tx = Math.min(0, Math.max(CROP_SIZE - larguraExibida, this.tx));
    this.ty = Math.min(0, Math.max(CROP_SIZE - alturaExibida, this.ty));
  }

  confirmar(): void {
    if (!this.pronto || this.salvando) return;

    this.salvando = true;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.salvando = false;
      return;
    }

    const tamanhoOrigem = CROP_SIZE / this.escala;
    const origemX = -this.tx / this.escala;
    const origemY = -this.ty / this.escala;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.drawImage(
      this.fotoImg.nativeElement,
      origemX,
      origemY,
      tamanhoOrigem,
      tamanhoOrigem,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE,
    );

    canvas.toBlob(blob => {
      this.salvando = false;
      if (blob) {
        this.dialogRef.close(blob);
      }
    }, 'image/jpeg', 0.9);
  }
}
