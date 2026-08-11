import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './registro.html',
  styleUrl: './login.scss',
})
export class RegistroComponent {
  form: FormGroup;
  loading = false;
  erro = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  criarConta() {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.registro(this.form.value).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (e: any) => { this.erro = e.error?.mensagem || 'Erro ao criar conta.'; this.loading = false; },
    });
  }
}
