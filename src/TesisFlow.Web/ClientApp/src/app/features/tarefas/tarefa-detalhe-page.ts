import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { TarefaService } from './tarefa.service';
import { ComentarioService } from './comentario.service';
import { AnexoService } from './anexo.service';
import { HistoricoTarefaService } from './historico-tarefa.service';
import { AuthService } from '../../core/services/auth.service';
import { MencaoService } from '../../core/services/mencao.service';
import { Tarefa, Comentario, Anexo, HistoricoTarefa, Reacao, TarefaSave, StatusTarefa, PrioridadeTarefa, TipoTarefa, ProjetoMembro } from '../../core/models';
import { ProjetoService } from '../projetos/projeto.service';

interface EventoHistorico { icon: string; mensagem: string; autor: string; data: string; timestamp: number; }

@Component({
  selector: 'app-tarefa-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatExpansionModule, MatTooltipModule, DatePipe],
  templateUrl: './tarefa-detalhe-page.html',
  styleUrl: './tarefa-detalhe-page.scss',
})
export class TarefaDetalheComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  tarefa!: Tarefa;
  comentarios: Comentario[] = [];
  anexos: Anexo[] = [];
  historico: HistoricoTarefa[] = [];
  enviandoComentario = false; enviandoAnexo = false; dragOver = false; carregando = true;
  editandoDescricao = false; editandoComentarioId: number | null = null;
  comentarioEditHtml = ''; novoComentarioHtml = '';
  respondendoComentarioId: number | null = null; respostaHtml = '';
  minhaReacao: Record<number, string> = {}; reacoesMap: Record<number, Reacao[]> = {};
  atividadeTab: 'comentarios' | 'historico' = 'comentarios';
  readonly apiUrl = 'http://localhost:5051/api';
  readonly emojis = ['👍', '❤️', '😄', '🎉', '😮', '😢'];
  readonly emojiToCode: Record<string, string> = { '👍': ':like:', '❤️': ':heart:', '😄': ':laugh:', '🎉': ':party:', '😮': ':wow:', '😢': ':sad:' };
  readonly codeToEmoji: Record<string, string> = { ':like:': '👍', ':heart:': '❤️', ':laugh:': '😄', ':party:': '🎉', ':wow:': '😮', ':sad:': '😢' };
  statusOptions = [{value:StatusTarefa.Backlog,label:'Backlog'},{value:StatusTarefa.Fazer,label:'A Fazer'},{value:StatusTarefa.Andamento,label:'Em Andamento'},{value:StatusTarefa.Revisao,label:'Revisao'},{value:StatusTarefa.Feito,label:'Concluido'},{value:StatusTarefa.Cancelado,label:'Cancelado'}];
  prioridadeOptions = [{value:PrioridadeTarefa.Baixa,label:'Baixa'},{value:PrioridadeTarefa.Media,label:'Media'},{value:PrioridadeTarefa.Alta,label:'Alta'},{value:PrioridadeTarefa.Critica,label:'Critica'}];
  tipoOptions = [{value:TipoTarefa.Tarefa,label:'Tarefa'},{value:TipoTarefa.Bug,label:'Bug'},{value:TipoTarefa.Melhoria,label:'Melhoria'},{value:TipoTarefa.Historia,label:'Historia'}];
  membros: ProjetoMembro[] = [];
  private loaded = { comentarios: false, anexos: false, historico: false };

  contentHeight = 600;

  calcHeight() { this.contentHeight = window.innerHeight - 130; }

  @HostListener('window:resize') onResize() { this.calcHeight(); }

  ngOnDestroy() {
    document.querySelectorAll('.app-main, .app-content, .mat-drawer-content, mat-sidenav-content')
      .forEach(el => (el as HTMLElement).style.overflow = '');
  }

  constructor(
    private route: ActivatedRoute, private router: Router, private fb: FormBuilder,
    private tarefaService: TarefaService, private comentarioService: ComentarioService,
    private anexoService: AnexoService, private historicoService: HistoricoTarefaService,
    private mencaoService: MencaoService, private projetoService: ProjetoService,
    public auth: AuthService, private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.calcHeight();
    document.querySelectorAll('.app-main, .app-content, .mat-drawer-content, mat-sidenav-content')
      .forEach(el => (el as HTMLElement).style.overflow = 'hidden');
    const chave = this.route.snapshot.paramMap.get('chave') || '';
    this.tarefaService.obterPorChave(chave).subscribe(t => {
      this.tarefa = t;
      this.form = this.fb.group({
        titulo: [t.titulo, [Validators.required, Validators.maxLength(300)]],
        descricao: [t.descricao || '', Validators.maxLength(5000)],
        status: [t.status, Validators.required], prioridade: [t.prioridade, Validators.required],
        tipo: [t.tipo, Validators.required], responsavelIds: [t.responsaveis.map(r => r.id)],
      });
      this.carregarComentarios(); this.carregarAnexos(); this.carregarHistorico();
      this.projetoService.obter(t.projetoId).subscribe(p => this.membros = p.membros || []);
    });
  }

  get descricaoHtml(): string {
    const val = this.form?.get('descricao')?.value || '';
    if (!val || val.trim().length === 0) return '<span class="descricao-placeholder">Adicione uma descricao...</span>';
    return val;
  }
  comentarioHtml(c: Comentario): string { return (c.texto && c.texto.trim()) ? c.texto : '<span class="descricao-placeholder">Vazio</span>'; }
  toggleEditDescricao() { this.editandoDescricao = !this.editandoDescricao; if (!this.editandoDescricao) { const e = document.querySelector('.descricao-panel .editor-content') as HTMLElement; if (e) this.form.patchValue({descricao: e.innerHTML}); } }
  salvarDescricao() { this.toggleEditDescricao(); }
  format(cmd: string, value?: string) { document.execCommand(cmd, false, value); }
  inserirLink() { const url = prompt('URL:'); if (url) document.execCommand('createLink', false, url); }
  inserirCodigo() { const s = window.getSelection(); if (s?.rangeCount) { const r = s.getRangeAt(0); const code = document.createElement('code'); code.style.cssText='background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:0.85em;'; code.textContent = r.toString()||'codigo'; r.deleteContents(); r.insertNode(code); } }
  get isOwner(): (c: Comentario) => boolean { return (c: Comentario) => c.usuarioId === this.auth.usuario()?.id; }
  respostasDoComentario(paiId: number): Comentario[] { return this.comentarios.filter(c => c.comentarioPaiId === paiId); }
  comentariosPrincipais(): Comentario[] { return this.comentarios.filter(c => !c.comentarioPaiId); }

  carregarComentarios() { this.comentarioService.listar(this.tarefa.id).subscribe(c => { this.comentarios = c; for (const com of c) this.carregarReacoes(com.id); this.verificar(); }); }
  carregarAnexos() { this.anexoService.listar(this.tarefa.id).subscribe(a => { this.anexos = a; this.verificar(); }); }
  carregarHistorico() { this.historicoService.listar(this.tarefa.id).subscribe(h => { this.historico = h; this.verificar(); }); }
  verificar() { this.loaded.anexos = this.loaded.comentarios = this.loaded.historico = true; if (this.carregando) setTimeout(() => { this.carregando = false; this.cdr.detectChanges(); }, 300); }

  carregarReacoes(id: number) { this.comentarioService.listarReacoes(id).subscribe(r => { this.reacoesMap[id] = r; const uid = this.auth.usuario()?.id; if (uid) for (const re of r) { if (re.usuarios.some(u => u.usuarioId === uid)) this.minhaReacao[id] = this.codeToEmoji[re.emoji] || re.emoji; } this.cdr.detectChanges(); }); }
  reagir(c: Comentario, emoji: string) { const uid = this.auth.usuario()?.id; if (!uid) return; this.comentarioService.reagir(c.id, {emoji: this.emojiToCode[emoji] || emoji, usuarioId: uid}).subscribe(r => { this.reacoesMap[c.id] = r; if (r.some(x => x.usuarios.some(u => u.usuarioId === uid))) this.minhaReacao[c.id] = emoji; else delete this.minhaReacao[c.id]; this.cdr.detectChanges(); }); }
  getReacoes(c: Comentario): Reacao[] { return (this.reacoesMap[c.id] || []).map(r => ({...r, emoji: this.codeToEmoji[r.emoji] || r.emoji})); }

  get timeline(): EventoHistorico[] {
    const ev: EventoHistorico[] = [];
    ev.push({icon:'add_circle', mensagem:`<strong>${this.tarefa.criadorNome}</strong> criou esta tarefa`, autor:this.tarefa.criadorNome, data:this.tarefa.dataCriacao, timestamp:new Date(this.tarefa.dataCriacao).getTime()});
    for (const h of this.historico) ev.push({icon:'edit', mensagem:`<strong>${h.usuarioNome}</strong> alterou <em>${h.campo}</em><br><span class="historico-diff">${h.valorAntigo||'Nenhum'}</span> → <span class="historico-diff">${h.valorNovo||'Nenhum'}</span>`, autor:h.usuarioNome, data:h.dataCriacao, timestamp:new Date(h.dataCriacao).getTime()});
    for (const a of this.anexos) ev.push({icon:'attach_file', mensagem:`<strong>${a.usuarioNome}</strong> anexou <em>${a.nomeArquivo}</em>`, autor:a.usuarioNome, data:a.dataCriacao, timestamp:new Date(a.dataCriacao).getTime()});
    for (const c of this.comentariosPrincipais()) ev.push({icon:'chat_bubble_outline', mensagem:`<strong>${c.usuarioNome}</strong> comentou`, autor:c.usuarioNome, data:c.dataCriacao, timestamp:new Date(c.dataCriacao).getTime()});
    return ev.sort((a,b) => b.timestamp - a.timestamp);
  }

  enviarComentario() { const editor = document.querySelector('.novo-comentario-editor .editor-content') as HTMLElement; const html = editor?.innerHTML || ''; if (!html || html === '<br>') return; const uid = this.auth.usuario()!.id; this.enviandoComentario = true; this.comentarioService.criar({texto:html, tarefaId:this.tarefa.id, usuarioId:uid}).subscribe({next:()=>{this.novoComentarioHtml=''; this.enviandoComentario=false; this.carregarComentarios(); this.mencaoService.processarMencoes(html, this.membros, this.tarefa.chave||'', this.tarefa.titulo, uid, this.tarefa.projetoNome);}, error:()=>this.enviandoComentario=false}); }
  iniciarEdicaoComentario(c: Comentario) { if (this.editandoComentarioId !== c.id) { this.editandoComentarioId = c.id; this.comentarioEditHtml = c.texto; } }
  cancelarEdicaoComentario() { this.editandoComentarioId = null; this.comentarioEditHtml = ''; }
  salvarEdicaoComentario(c: Comentario) { const editor = document.querySelector(`.comentario-editor-${c.id} .editor-content`) as HTMLElement; const texto = editor?.innerHTML || ''; this.comentarioService.atualizar(c.id, {texto, tarefaId:c.tarefaId, usuarioId:c.usuarioId}).subscribe({next:()=>{this.editandoComentarioId=null; this.carregarComentarios();}}); }
  excluirComentario(c: Comentario) { if (!confirm('Excluir?')) return; this.comentarioService.excluir(c.id, c.usuarioId).subscribe({next:()=>this.carregarComentarios()}); }
  responder(c: Comentario) { this.respondendoComentarioId = c.comentarioPaiId || c.id; this.respostaHtml = ''; }
  cancelarResposta() { this.respondendoComentarioId = null; }
  enviarResposta(c: Comentario) { const editor = document.querySelector(`.resposta-editor-${c.id} .editor-content`) as HTMLElement; const html = editor?.innerHTML||''; if (!html||html==='<br>') return; const uid = this.auth.usuario()!.id; this.comentarioService.criar({texto:html, tarefaId:this.tarefa.id, usuarioId:uid, comentarioPaiId:c.comentarioPaiId||c.id}).subscribe({next:()=>{this.respondendoComentarioId=null; this.carregarComentarios(); this.mencaoService.processarMencoes(html, this.membros, this.tarefa.chave||'', this.tarefa.titulo, uid, this.tarefa.projetoNome);}}); }
  formatarTamanho(b: number): string { if (b<1024) return b+' B'; if (b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }
  enviarArquivo(file: File) { this.enviandoAnexo=true; this.anexoService.upload(this.tarefa.id, file, this.auth.usuario()!.id).subscribe({next:()=>{this.enviandoAnexo=false; this.carregarAnexos();}, error:()=>this.enviandoAnexo=false}); }
  uploadAnexo(e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) this.enviarArquivo(f); }
  excluirAnexo(id: number) { this.anexoService.excluir(id).subscribe({next:()=>this.carregarAnexos()}); }
  onDragOver(e: DragEvent) { e.preventDefault(); this.dragOver = true; }
  onDragLeave(e: DragEvent) { e.preventDefault(); this.dragOver = false; }
  onDrop(e: DragEvent) { e.preventDefault(); this.dragOver = false; const f = e.dataTransfer?.files?.[0]; if (f) this.enviarArquivo(f); }

  @HostListener('document:click', ['$event'])
  fecharMenusAcoes(e: MouseEvent) { const t = e.target as HTMLElement; if (!t.closest('.card-menu-btn') && !t.closest('.acao-dropdown')) { /* keep open */ } }

  salvar() { if (this.form.invalid) return; if (this.editandoDescricao) this.toggleEditDescricao(); this.tarefaService.atualizar(this.tarefa.id, {titulo:this.form.value.titulo, descricao:this.form.value.descricao, status:this.form.value.status, prioridade:this.form.value.prioridade, tipo:this.form.value.tipo, projetoId:this.tarefa.projetoId, responsavelIds:this.form.value.responsavelIds||[], criadorId:this.tarefa.criadorId}).subscribe({next:()=>this.cdr.detectChanges()}); }
}
