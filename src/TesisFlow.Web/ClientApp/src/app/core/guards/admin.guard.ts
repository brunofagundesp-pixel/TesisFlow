import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const cargo = this.auth.usuario()?.cargo?.toLowerCase();
    if (cargo === 'admin') return true;
    this.router.navigate(['/dashboard']);
    return false;
  }
}
