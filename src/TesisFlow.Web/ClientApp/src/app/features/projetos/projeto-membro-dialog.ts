import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-projeto-membro-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Convidar membro para {{ data.projetoNome }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Email do usuario</mat-label>
          <input matInput formControlName="email" placeholder="email@exemplo.com" autofocus>
          @if (form.get('email')?.hasError('required')) {
            <mat-error>Email e obrigatorio</mat-error>
          }
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Email invalido</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="fechar()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="convidar()">Convidar</button>
    </mat-dialog-actions>
  `,
})
export class ProjetoMembroDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ProjetoMembroDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { projetoId: number; projetoNome: string },
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  convidar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value.email);
  }

  fechar() {
    this.dialogRef.close();
  }
}
