export const TOKEN_STORAGE_KEY = 'tesisflow_token';
export const USUARIO_STORAGE_KEY = 'tesisflow_user';

export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function definirToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function removerToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function limparSessao(): void {
  removerToken();
  localStorage.removeItem(USUARIO_STORAGE_KEY);
}
