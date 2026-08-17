import { Tarefa } from '../models';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function escapar(texto: string): string {
  return (texto || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function htmlParaTexto(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || div.innerText || '').trim();
}

function dataIcs(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function agoraIcs(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function montarDescricao(tarefa: Tarefa): string {
  const partes: string[] = [];
  const desc = htmlParaTexto(tarefa.descricao || '');
  if (desc) partes.push(desc);
  partes.push(`Projeto: ${tarefa.projetoNome || '-'}`);
  if (tarefa.chave) partes.push(`Tarefa: ${tarefa.chave}`);
  return partes.join('\n');
}

export function gerarEventoIcs(tarefa: Tarefa): string {
  const inicio = tarefa.dataEntrega ? new Date(tarefa.dataEntrega) : new Date();
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);

  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TesisFlow//PT-BR',
    'BEGIN:VEVENT',
    `UID:${tarefa.id}@tesisflow`,
    `DTSTAMP:${agoraIcs()}`,
    `DTSTART;VALUE=DATE:${dataIcs(inicio)}`,
    `DTEND;VALUE=DATE:${dataIcs(fim)}`,
    `SUMMARY:${escapar(tarefa.titulo)}`,
    `DESCRIPTION:${escapar(montarDescricao(tarefa))}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Lembrete: ${escapar(tarefa.titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return linhas.join('\r\n');
}

function dataLocal(tarefa: Tarefa): Date {
  return tarefa.dataEntrega ? new Date(tarefa.dataEntrega) : new Date();
}

function dataLocalIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function gerarUrlGoogle(tarefa: Tarefa): string {
  const inicio = dataLocal(tarefa);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: tarefa.titulo,
    dates: `${dataIcs(inicio)}/${dataIcs(fim)}`,
    details: montarDescricao(tarefa),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function gerarUrlOutlook(tarefa: Tarefa): string {
  const inicio = dataLocal(tarefa);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: tarefa.titulo,
    body: montarDescricao(tarefa),
    startdt: `${dataLocalIso(inicio)}T00:00:00`,
    enddt: `${dataLocalIso(inicio)}T23:59:59`,
    allday: 'true',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function baixarEventoIcs(tarefa: Tarefa): void {
  const conteudo = gerarEventoIcs(tarefa);
  const blob = new Blob([conteudo], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${tarefa.chave || `tarefa-${tarefa.id}`}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
