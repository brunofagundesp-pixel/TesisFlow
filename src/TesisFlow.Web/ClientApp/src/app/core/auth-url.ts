import { Pipe, PipeTransform } from '@angular/core';
import { obterToken } from './token-storage';

export function comToken(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  const ehApi = url.startsWith('/api/') || url.includes('/api/');
  if (!ehApi) return url;
  const token = obterToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

export function tokenizarHtml(html: string): string {
  const token = obterToken();
  if (!token) return html;
  return html.replace(/(src\s*=\s*["'])([^"']+)(["'])/gi, (match, prefixo, url, sufixo) => {
    if (url.includes('/api/') && !url.includes('token=')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${prefixo}${url}${sep}token=${encodeURIComponent(token)}${sufixo}`;
    }
    return match;
  });
}

@Pipe({ name: 'authUrl', standalone: true })
export class AuthUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null | undefined {
    return comToken(url);
  }
}
