export function removerAcentos(s: string): string {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizarTexto(s: string): string {
  return removerAcentos(s).toLowerCase().trim();
}
