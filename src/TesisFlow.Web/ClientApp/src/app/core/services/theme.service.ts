import { Injectable, signal, computed } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'tesisflow_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private media = window.matchMedia('(prefers-color-scheme: dark)');

  private _preference = signal<ThemePreference>(this.carregarPreferencia());
  readonly preference = this._preference.asReadonly();

  private _resolved = signal<'light' | 'dark'>('light');
  readonly resolved = this._resolved.asReadonly();

  readonly isDark = computed(() => this._resolved() === 'dark');

  constructor() {
    this.aplicar();
    this.media.addEventListener('change', () => this.aplicar());
  }

  initialize(): void {
    this.aplicar();
  }

  setTheme(pref: ThemePreference): void {
    this._preference.set(pref);
    localStorage.setItem(STORAGE_KEY, pref);
    this.aplicar();
  }

  private carregarPreferencia(): ThemePreference {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'light';
  }

  private aplicar(): void {
    const pref = this._preference();
    const isDark = pref === 'system' ? this.media.matches : pref === 'dark';
    this._resolved.set(isDark ? 'dark' : 'light');

    const el = document.documentElement;
    el.classList.toggle('dark', isDark);
    el.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}
