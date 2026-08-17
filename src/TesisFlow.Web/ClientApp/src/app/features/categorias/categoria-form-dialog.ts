import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconPickerComponent } from './icon-picker';

@Component({
  selector: 'app-categoria-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, IconPickerComponent],
  templateUrl: './categoria-form-dialog.html',
  styleUrl: './categoria-form-dialog.scss',
})
export class CategoriaFormDialogComponent {
  form: FormGroup;
  icone = 'task_alt';
  cor = '#ff8615';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CategoriaFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { id?: number; nome?: string; icone?: string; cor?: string } | null,
  ) {
    this.icone = data?.icone || 'task_alt';
    this.cor = data?.cor || '#ff8615';
    this.form = this.fb.group({
      nome: [data?.nome || '', [Validators.required, Validators.maxLength(100)]],
    });
  }

  onIcone(i: { icone: string; cor: string }) {
    this.icone = i.icone;
    this.cor = i.cor;
  }

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close({ nome: this.form.value.nome.trim(), icone: this.icone, cor: this.cor });
  }

  fechar() {
    this.dialogRef.close();
  }
}
