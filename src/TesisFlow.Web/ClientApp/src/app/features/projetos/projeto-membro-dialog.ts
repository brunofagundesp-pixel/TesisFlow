import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-projeto-membro-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './projeto-membro-dialog.html',
  styleUrl: './projeto-membro-dialog.scss',
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
