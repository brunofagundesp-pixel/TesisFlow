import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { Subscription, skip } from 'rxjs';
import { TarefaService } from '../tarefas/tarefa.service';
import { ComentarioService } from '../tarefas/comentario.service';
import { AuthService } from '../../core/services/auth.service';
import { MeuDiaService } from '../../core/services/meu-dia.service';
import { MencaoService } from '../../core/services/mencao.service';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { ImagemService } from '../../core/services/imagem.service';
import { MencaoDropdownComponent, MembroMencao } from '../../shared/mencao-dropdown';
import { AnexoService } from '../tarefas/anexo.service';
import { HistoricoTarefaService } from '../tarefas/historico-tarefa.service';
import { ProjetoService } from '../projetos/projeto.service';
import { Tarefa, Comentario, Anexo, HistoricoTarefa, Reacao, StatusTarefa, PrioridadeTarefa, ProjetoMembro, ColegioRef, Categoria } from '../../core/models';
import { ColegioSelectComponent } from '../../shared/colegio-select/colegio-select';
import { CategoriaService } from '../categorias/categoria.service';
import { toDateTimeLocal, toUtcIso } from '../../core/utils/date.util';
import { baixarEventoIcs } from '../../core/utils/calendar.util';

interface EventoHistorico {
  icon: string;
  mensagem: string;
  autor: string;
  data: string;
  timestamp: number;
}

@Component({
  selector: 'app-tarefa-detalhe-sidebar',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatExpansionModule, MatTooltipModule,
    DatePipe,
    MencaoDropdownComponent,
    ColegioSelectComponent,
  ],
  templateUrl: './tarefa-detalhe-sidebar.html',
  styleUrl: './tarefa-detalhe-sidebar.scss',
})
export class TarefaDetalheSidebarComponent implements OnChanges, OnDestroy {
  @Input() tarefa!: Tarefa;
  @Output() fechar = new EventEmitter<void>();
  @Output() alterado = new EventEmitter<void>();

  form!: FormGroup;
  comentarioForm!: FormGroup;
  membros: ProjetoMembro[] = [];
  comentarios: Comentario[] = [];
  anexos: Anexo[] = [];
  historico: HistoricoTarefa[] = [];
  enviandoComentario = false;
  enviandoAnexo = false;
  dragOver = false;
  carregando = true;
  editandoDescricao = false;
  editandoComentarioId: number | null = null;
  comentarioEditHtml = '';
  novoComentarioHtml = '';
  respondendoComentarioId: number | null = null;
  respostaHtml = '';
  minhaReacao: Record<number, string> = {};
  reacoesMap: Record<number, Reacao[]> = {};
  atividadeTab: 'comentarios' | 'historico' = 'comentarios';

  mencaoTermo = '';
  mostrarMencaoDropdown = false;

  readonly emojis = ['👍', '❤️', '😄', '🎉', '😮', '😢'];
  readonly emojiToCode: Record<string, string> = { '👍': ':like:', '❤️': ':heart:', '😄': ':laugh:', '🎉': ':party:', '😮': ':wow:', '😢': ':sad:' };
  readonly codeToEmoji: Record<string, string> = { ':like:': '👍', ':heart:': '❤️', ':laugh:': '😄', ':party:': '🎉', ':wow:': '😮', ':sad:': '😢' };

  statusOptions = [
    { value: StatusTarefa.Backlog, label: 'Backlog' },
    { value: StatusTarefa.Fazer, label: 'A Fazer' },
    { value: StatusTarefa.Andamento, label: 'Em Andamento' },
    { value: StatusTarefa.Revisao, label: 'Revisao' },
    { value: StatusTarefa.Feito, label: 'Concluido' },
    { value: StatusTarefa.Cancelado, label: 'Cancelado' },
  ];

  prioridadeOptions = [
    { value: PrioridadeTarefa.Baixa, label: 'Baixa' },
    { value: PrioridadeTarefa.Media, label: 'Media' },
    { value: PrioridadeTarefa.Alta, label: 'Alta' },
    { value: PrioridadeTarefa.Critica, label: 'Critica' },
  ];

  categorias: Categoria[] = [];

  readonly apiUrl = 'http://localhost:5051/api';

  private subs: Subscription[] = [];
  private loaded = { comentarios: false, anexos: false, historico: false };
  private inicial: { titulo: string; descricao: string; status: number; prioridade: number; tipo: number; responsavelIds: number[]; colegioId: number | null; colegioNome: string | null; contatoNome: string; dataEntrega: string } | null = null;
  private salvando = false;

  constructor(
    private fb: FormBuilder,
    private tarefaService: TarefaService,
    private comentarioService: ComentarioService,
    private mencaoService: MencaoService,
    private anexoService: AnexoService,
    private historicoService: HistoricoTarefaService,
    public auth: AuthService,
    private projetoService: ProjetoService,
    private categoriaService: CategoriaService,
    public meuDiaService: MeuDiaService,
    private notificacaoService: NotificacaoService,
    private imagemService: ImagemService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tarefa'] && this.tarefa) {
      this.inicializar();
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private inicializar(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];

    this.notificacaoService.marcarTarefaLida(this.tarefa.id);

    this.membros = [];
    this.comentarios = [];
    this.anexos = [];
    this.historico = [];
    this.enviandoComentario = false;
    this.enviandoAnexo = false;
    this.dragOver = false;
    this.carregando = true;
    this.editandoDescricao = false;
    this.editandoComentarioId = null;
    this.comentarioEditHtml = '';
    this.novoComentarioHtml = '';
    this.respondendoComentarioId = null;
    this.respostaHtml = '';
    this.minhaReacao = {};
    this.reacoesMap = {};
    this.atividadeTab = 'comentarios';
    this.mencaoTermo = '';
    this.mostrarMencaoDropdown = false;
    this.salvando = false;
    this.loaded = { comentarios: false, anexos: false, historico: false };

    this.meuDiaService.inicializar();

    this.categoriaService.listarPorProjeto(this.tarefa.projetoId).subscribe(c => this.categorias = c);

    this.projetoService.obter(this.tarefa.projetoId).subscribe(p => this.membros = p.membros || []);

    this.form = this.fb.group({
      titulo: [this.tarefa.titulo, [Validators.required, Validators.maxLength(300)]],
      descricao: [this.tarefa.descricao || '', Validators.maxLength(5000)],
      status: [this.tarefa.status, Validators.required],
      prioridade: [this.tarefa.prioridade, Validators.required],
      tipo: [this.tarefa.tipo, Validators.required],
      responsavelIds: [this.tarefa.responsaveis.map(r => r.id)],
      colegio: [this.tarefa.colegioId ? { id: this.tarefa.colegioId, nome: this.tarefa.colegioNome || '' } : null],
      contatoNome: [this.tarefa.contatoNome || ''],
      dataEntrega: [toDateTimeLocal(this.tarefa.dataEntrega)],
    });

    this.inicial = {
      titulo: this.tarefa.titulo,
      descricao: this.tarefa.descricao || '',
      status: this.tarefa.status,
      prioridade: this.tarefa.prioridade,
      tipo: this.tarefa.tipo,
      responsavelIds: this.tarefa.responsaveis.map(r => r.id),
      colegioId: this.tarefa.colegioId ?? null,
      colegioNome: this.tarefa.colegioNome ?? null,
      contatoNome: this.tarefa.contatoNome || '',
      dataEntrega: toDateTimeLocal(this.tarefa.dataEntrega),
    };

    this.comentarioForm = this.fb.group({
      texto: ['', Validators.required],
    });

    this.subs.push(
      this.form.get('colegio')!.valueChanges.pipe(skip(1)).subscribe(() => this.salvar()),
    );

    this.carregarComentarios();
    this.carregarAnexos();
    this.carregarHistorico();
  }

  fecharSidebar(): void {
    this.fechar.emit();
  }

  salvar(): void {
    if (!this.form || this.form.invalid || this.salvando) return;

    const valor = this.form.value;
    const colegio: ColegioRef | null = valor.colegio || null;
    const novo = {
      titulo: valor.titulo,
      descricao: valor.descricao || '',
      status: valor.status,
      prioridade: valor.prioridade,
      tipo: valor.tipo,
      responsavelIds: valor.responsavelIds || [],
      colegioId: colegio?.id ?? null,
      colegioNome: colegio?.nome ?? null,
      contatoNome: valor.contatoNome || '',
      dataEntrega: valor.dataEntrega || '',
    };

    if (
      this.inicial &&
      novo.titulo === this.inicial.titulo &&
      novo.descricao === this.inicial.descricao &&
      novo.status === this.inicial.status &&
      novo.prioridade === this.inicial.prioridade &&
      novo.tipo === this.inicial.tipo &&
      this.mesmosIds(novo.responsavelIds, this.inicial.responsavelIds) &&
      novo.colegioId === this.inicial.colegioId &&
      novo.contatoNome === this.inicial.contatoNome &&
      novo.dataEntrega === this.inicial.dataEntrega
    ) {
      return;
    }

    this.salvando = true;
    const dto = {
      titulo: novo.titulo,
      descricao: novo.descricao,
      status: novo.status,
      prioridade: novo.prioridade,
      tipo: novo.tipo,
      projetoId: this.tarefa.projetoId,
      responsavelIds: novo.responsavelIds,
      criadorId: this.tarefa.criadorId,
      atorId: this.auth.usuario()?.id,
      colegioId: novo.colegioId ?? undefined,
      colegioNome: novo.colegioNome ?? undefined,
      contatoNome: novo.contatoNome || undefined,
      dataEntrega: toUtcIso(novo.dataEntrega),
    };

    this.tarefaService.atualizar(this.tarefa.id, dto).subscribe({
      next: () => {
        this.salvando = false;
        this.inicial = {
          titulo: novo.titulo,
          descricao: novo.descricao,
          status: novo.status,
          prioridade: novo.prioridade,
          tipo: novo.tipo,
          responsavelIds: [...novo.responsavelIds],
          colegioId: novo.colegioId,
          colegioNome: novo.colegioNome,
          contatoNome: novo.contatoNome,
          dataEntrega: novo.dataEntrega,
        };
        this.tarefa = { ...this.tarefa, titulo: novo.titulo, descricao: novo.descricao, status: novo.status, prioridade: novo.prioridade, tipo: novo.tipo, colegioId: novo.colegioId ?? undefined, colegioNome: novo.colegioNome ?? undefined, contatoNome: novo.contatoNome, dataEntrega: toUtcIso(novo.dataEntrega) ?? undefined };
        this.alterado.emit();
      },
      error: () => {
        this.salvando = false;
      },
    });
  }

  private mesmosIds(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  }

  carregarComentarios() {
    this.comentarioService.listar(this.tarefa.id).subscribe(c => {
      this.comentarios = c;
      this.cdr.detectChanges();
      for (const com of c) this.carregarReacoes(com.id);
      this.verificarCarregamento();
    });
  }

  enviarComentario() {
    const editor = document.querySelector('.novo-comentario-editor .editor-content') as HTMLElement;
    const html = editor?.innerHTML || '';
    if (!html || html.trim().length === 0 || html === '<br>') return;

    const userId = this.auth.usuario()!.id;
    this.enviandoComentario = true;

    this.comentarioService.criar({
      texto: html,
      tarefaId: this.tarefa.id,
      usuarioId: userId,
    }).subscribe({
      next: () => {
        this.novoComentarioHtml = '';
        this.enviandoComentario = false;
        this.carregarComentarios();
        this.mencaoService.processarMencoes(html, this.membros, this.tarefa.chave || '', this.tarefa.titulo, userId, this.tarefa.projetoNome, this.tarefa.id, this.tarefa.projetoId);
      },
      error: () => {
        this.enviandoComentario = false;
      },
    });
  }

  toggleEditDescricao() {
    this.editandoDescricao = !this.editandoDescricao;
    if (!this.editandoDescricao) {
      const editor = document.querySelector('.descricao-panel .editor-content') as HTMLElement;
      if (editor) this.form.patchValue({ descricao: editor.innerHTML });
    }
  }

  salvarDescricao() {
    const editor = document.querySelector('.descricao-panel .editor-content') as HTMLElement;
    if (editor) this.form.patchValue({ descricao: editor.innerHTML });
    this.editandoDescricao = false;
    this.salvar();
  }

  onComentarioInput(event: Event): void {
    const el = event.target as HTMLElement;
    const text = el.textContent || '';
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) { this.mostrarMencaoDropdown = false; return; }

    const range = selection.getRangeAt(0);
    const textBeforeCursor = text.substring(0, range.startOffset);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex === -1) { this.mostrarMencaoDropdown = false; return; }

    const termo = textBeforeCursor.substring(atIndex + 1);
    if (termo.includes(' ')) { this.mostrarMencaoDropdown = false; return; }

    this.mencaoTermo = termo;
    this.mostrarMencaoDropdown = true;
  }

  inserirMencao(membro: MembroMencao): void {
    this.mostrarMencaoDropdown = false;
    const editor = document.querySelector('.novo-comentario-editor .editor-content') as HTMLElement;
    if (!editor) return;

    const html = editor.innerHTML;
    const termo = this.escapeRegex(this.mencaoTermo);
    const mencaoHtml = `<span data-mention="${membro.usuarioId}" class="mencao-tag">@${membro.usuarioNome}</span>&nbsp;`;
    const novoHtml = html.replace(new RegExp(`@${termo}$`), mencaoHtml);

    editor.innerHTML = novoHtml;
    this.novoComentarioHtml = novoHtml;

    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  iniciarEdicaoComentario(c: Comentario) {
    if (this.editandoComentarioId !== c.id) {
      this.editandoComentarioId = c.id;
      this.comentarioEditHtml = c.texto;
    }
  }

  salvarEdicaoComentario(c: Comentario) {
    const editor = document.querySelector(`.comentario-editor-${c.id} .editor-content`) as HTMLElement;
    const novoTexto = editor?.innerHTML || '';
    this.comentarioEditHtml = '';

    this.comentarioService.atualizar(c.id, { texto: novoTexto, tarefaId: c.tarefaId, usuarioId: c.usuarioId }).subscribe({
      next: () => {
        this.editandoComentarioId = null;
        this.carregarComentarios();
      },
    });
  }

  cancelarEdicaoComentario() {
    this.editandoComentarioId = null;
    this.comentarioEditHtml = '';
  }

  get isOwner(): (c: Comentario) => boolean {
    return (c: Comentario) => c.usuarioId === this.auth.usuario()?.id;
  }

  temMeuDia(): boolean {
    return this.meuDiaService.tem(this.tarefa.id);
  }

  souResponsavel(): boolean {
    const uid = this.auth.usuario()?.id;
    return uid != null && this.tarefa.responsaveis.some(r => r.id === uid);
  }

  alternarMeuDia(): void {
    this.meuDiaService.alternar(this.tarefa).subscribe();
  }

  excluirComentario(c: Comentario) {
    if (!confirm('Excluir este comentario?')) return;
    this.comentarioService.excluir(c.id, c.usuarioId).subscribe({
      next: () => this.carregarComentarios(),
      error: err => console.error('Erro ao excluir:', err),
    });
  }

  responderComentario(c: Comentario) {
    this.respondendoComentarioId = c.comentarioPaiId || c.id;
    this.respostaHtml = '';
  }

  cancelarResposta() {
    this.respondendoComentarioId = null;
    this.respostaHtml = '';
  }

  enviarResposta(c: Comentario) {
    const editor = document.querySelector(`.resposta-editor-${c.id} .editor-content`) as HTMLElement;
    const html = editor?.innerHTML || '';
    if (!html || html.trim().length === 0 || html === '<br>') return;

    const userId = this.auth.usuario()!.id;
    const paiId = c.comentarioPaiId || c.id;
    this.comentarioService.criar({
      texto: html,
      tarefaId: this.tarefa.id,
      usuarioId: userId,
      comentarioPaiId: paiId,
    }).subscribe({
      next: () => {
        this.respondendoComentarioId = null;
        this.respostaHtml = '';
        this.carregarComentarios();
        this.mencaoService.processarMencoes(html, this.membros, this.tarefa.chave || '', this.tarefa.titulo, userId, this.tarefa.projetoNome, this.tarefa.id, this.tarefa.projetoId);
      },
    });
  }

  respostasDoComentario(paiId: number): Comentario[] {
    return this.comentarios.filter(c => c.comentarioPaiId === paiId);
  }

  comentariosPrincipais(): Comentario[] {
    return this.comentarios.filter(c => !c.comentarioPaiId);
  }

  get timeline(): EventoHistorico[] {
    const eventos: EventoHistorico[] = [];

    eventos.push({
      icon: 'add_circle',
      mensagem: `<strong>${this.tarefa.criadorNome}</strong> criou esta tarefa`,
      autor: this.tarefa.criadorNome,
      data: this.tarefa.dataCriacao,
      timestamp: new Date(this.tarefa.dataCriacao).getTime(),
    });

    for (const h of this.historico) {
      const antigo = h.valorAntigo || 'Nenhum';
      const novo = h.valorNovo || 'Nenhum';
      eventos.push({
        icon: 'edit',
        mensagem: `<strong>${h.usuarioNome}</strong> alterou <em>${h.campo}</em><br><span class="historico-diff">${antigo}</span> → <span class="historico-diff">${novo}</span>`,
        autor: h.usuarioNome,
        data: h.dataCriacao,
        timestamp: new Date(h.dataCriacao).getTime(),
      });
    }

    for (const a of this.anexos) {
      eventos.push({
        icon: 'attach_file',
        mensagem: `<strong>${a.usuarioNome}</strong> anexou <em>${a.nomeArquivo}</em>`,
        autor: a.usuarioNome,
        data: a.dataCriacao,
        timestamp: new Date(a.dataCriacao).getTime(),
      });
    }

    for (const c of this.comentarios.filter(c => !c.comentarioPaiId)) {
      eventos.push({
        icon: 'chat_bubble_outline',
        mensagem: `<strong>${c.usuarioNome}</strong> comentou nesta tarefa`,
        autor: c.usuarioNome,
        data: c.dataCriacao,
        timestamp: new Date(c.dataCriacao).getTime(),
      });
    }

    return eventos.sort((a, b) => b.timestamp - a.timestamp);
  }

  format(cmd: string, value?: string) { document.execCommand(cmd, false, value); }

  inserirLink() {
    const url = prompt('URL do link:');
    if (url) document.execCommand('createLink', false, url);
  }

  inserirImagem() {
    const url = prompt('URL da imagem:');
    if (url) document.execCommand('insertImage', false, url);
  }

  imagemAmpliada: string | null = null;

  onDescricaoPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          this.imagemService.upload(file).subscribe({
            next: res => this.inserirImagemHtml(res.url),
            error: () => {},
          });
        }
        return;
      }
    }
  }

  private inserirImagemHtml(url: string) {
    document.execCommand('insertHTML', false, `<img src="${url}" class="descricao-img" />`);
  }

  onDescricaoViewClick(event: MouseEvent) {
    const img = (event.target as HTMLElement).closest('img.descricao-img');
    if (img) {
      event.stopPropagation();
      this.imagemAmpliada = (img as HTMLImageElement).src;
      return;
    }
    this.toggleEditDescricao();
  }

  fecharImagem() {
    this.imagemAmpliada = null;
  }

  adicionarAoCalendario() {
    baixarEventoIcs(this.tarefa);
  }

  inserirCodigo() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const code = document.createElement('code');
      code.style.cssText = 'background:var(--tf-surface-hover);padding:2px 6px;border-radius:4px;font-size:0.85em;';
      code.textContent = range.toString() || 'codigo';
      range.deleteContents();
      range.insertNode(code);
    }
  }

  get descricaoHtml(): string {
    const val = this.form.get('descricao')?.value || '';
    if (!val || val.trim().length === 0) return '<span class="descricao-placeholder">Adicione uma descricao...</span>';
    return val;
  }

  comentarioHtml(c: Comentario): string {
    if (!c.texto || c.texto.trim().length === 0) return '<span class="descricao-placeholder">Vazio</span>';
    return c.texto;
  }

  carregarReacoes(comentarioId: number) {
    this.comentarioService.listarReacoes(comentarioId).subscribe(r => {
      this.reacoesMap[comentarioId] = r;
      const userId = this.auth.usuario()?.id;
      if (userId) {
        for (const re of r) {
          const emoji = this.codeToEmoji[re.emoji] || re.emoji;
          if (re.usuarios.some(u => u.usuarioId === userId)) {
            this.minhaReacao[comentarioId] = emoji;
          }
        }
      }
      this.cdr.detectChanges();
    });
  }

  reagirComentario(c: Comentario, emoji: string) {
    const userId = this.auth.usuario()?.id;
    if (!userId) return;
    const code = this.emojiToCode[emoji] || emoji;
    this.comentarioService.reagir(c.id, { emoji: code, usuarioId: userId }).subscribe(reacoes => {
      this.reacoesMap[c.id] = reacoes;
      if (reacoes.some(r => r.usuarios.some(u => u.usuarioId === userId))) {
        this.minhaReacao[c.id] = emoji;
      } else {
        delete this.minhaReacao[c.id];
      }
      this.cdr.detectChanges();
    });
  }

  getReacoes(c: Comentario): Reacao[] {
    const raw = this.reacoesMap[c.id] || [];
    return raw.map(r => ({ ...r, emoji: this.codeToEmoji[r.emoji] || r.emoji }));
  }

  carregarAnexos() {
    this.anexoService.listar(this.tarefa.id).subscribe(a => {
      this.anexos = a;
      this.verificarCarregamento();
    });
  }

  carregarHistorico() {
    this.historicoService.listar(this.tarefa.id).subscribe(h => {
      this.historico = h;
      this.verificarCarregamento();
    });
  }

  private verificarCarregamento() {
    this.loaded.anexos = true;
    this.loaded.comentarios = true;
    this.loaded.historico = true;
    if (this.carregando && this.loaded.anexos && this.loaded.comentarios && this.loaded.historico) {
      setTimeout(() => { this.carregando = false; this.cdr.detectChanges(); }, 300);
    }
  }

  uploadAnexo(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.enviarArquivo(file);
  }

  excluirAnexo(id: number) {
    this.anexoService.excluir(id).subscribe({
      next: () => this.carregarAnexos(),
    });
  }

  formatarTamanho(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    this.enviarArquivo(file);
  }

  private enviarArquivo(file: File) {
    this.enviandoAnexo = true;
    const usuarioId = this.auth.usuario()!.id;
    this.anexoService.upload(this.tarefa.id, file, usuarioId).subscribe({
      next: () => {
        this.enviandoAnexo = false;
        this.carregarAnexos();
      },
      error: () => {
        this.enviandoAnexo = false;
      },
    });
  }
}
