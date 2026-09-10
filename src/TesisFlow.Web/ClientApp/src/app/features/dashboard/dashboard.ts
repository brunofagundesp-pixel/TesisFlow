import { Component, OnInit, ChangeDetectorRef, HostListener, ElementRef, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TarefaService } from '../tarefas/tarefa.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthUrlPipe } from '../../core/auth-url';
import { UsuarioService } from '../../core/services/usuario.service';
import { MeuDiaService } from '../../core/services/meu-dia.service';
import { TarefaDetalheModalComponent } from '../projetos/tarefa-detalhe-modal';
import { BannerCropDialogComponent } from './banner-crop-dialog';
import { Tarefa, StatusTarefa, TarefaSave } from '../../core/models';

interface GrupoProjeto {
  projetoId: number;
  projetoNome: string;
  tarefas: Tarefa[];
}

const STATUS_LABEL: Record<number, string> = {
  [StatusTarefa.Backlog]: 'Backlog',
  [StatusTarefa.Fazer]: 'A Fazer',
  [StatusTarefa.Andamento]: 'Em Andamento',
  [StatusTarefa.Revisao]: 'Revisao',
  [StatusTarefa.Feito]: 'Concluido',
  [StatusTarefa.Cancelado]: 'Cancelado',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, AuthUrlPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  tarefasAgrupadas: GrupoProjeto[] = [];
  carregando = true;
  private todasTarefas: Tarefa[] = [];
  statusMenu: Tarefa | null = null;
  statusMenuPos = { top: 0, left: 0 };

  carregandoBanner = false;

  @ViewChild('bannerInput') bannerInput!: ElementRef<HTMLInputElement>;
  @ViewChild('banner') bannerEl!: ElementRef<HTMLDivElement>;

  get usuario() {
    return this.auth.usuario();
  }

  readonly statusEntries: [number, string][] = [
    [StatusTarefa.Backlog, 'Backlog'],
    [StatusTarefa.Fazer, 'A Fazer'],
    [StatusTarefa.Andamento, 'Em Andamento'],
    [StatusTarefa.Revisao, 'Revisao'],
    [StatusTarefa.Feito, 'Concluido'],
    [StatusTarefa.Cancelado, 'Cancelado'],
  ];

  constructor(
    private tarefaService: TarefaService,
    private auth: AuthService,
    private usuarioService: UsuarioService,
    public meuDiaService: MeuDiaService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
  ) {}

  get meuDiaTarefas(): Tarefa[] {
    return this.meuDiaService.tarefas();
  }

  temMeuDia(tarefa: Tarefa): boolean {
    return this.meuDiaService.tem(tarefa.id);
  }

  souResponsavel(tarefa: Tarefa): boolean {
    const uid = this.auth.usuario()?.id;
    return uid != null && tarefa.responsaveis.some(r => r.id === uid);
  }

  alternarMeuDia(tarefa: Tarefa): void {
    this.meuDiaService.alternar(tarefa).subscribe({
      error: () => this.snackbar.open('Não foi possível atualizar o Meu dia.', 'OK', { duration: 3000 }),
    });
  }

  ngOnInit() {
    this.meuDiaService.inicializar();
    this.carregar();
  }

  abrirSeletorBanner(): void {
    this.bannerInput.nativeElement.click();
  }

  onBannerSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';

    if (!arquivo) return;
    if (!this.usuario) return;

    if (!arquivo.type.startsWith('image/')) {
      this.snackbar.open('Selecione um arquivo de imagem.', 'OK', { duration: 3000 });
      return;
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      this.snackbar.open('A imagem deve ter no máximo 5MB.', 'OK', { duration: 3000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;

      const el = this.bannerEl?.nativeElement;
      const aspectRatio = el && el.clientHeight > 0 ? el.clientWidth / el.clientHeight : 8;

      const dialogRef = this.dialog.open(BannerCropDialogComponent, {
        width: '760px',
        maxWidth: '95vw',
        data: { imageUrl, aspectRatio },
      });

      dialogRef.afterClosed().subscribe((blob: Blob | null) => {
        if (!blob) return;
        const arquivoCortado = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
        this.uploadBanner(arquivoCortado);
      });
    };
    reader.readAsDataURL(arquivo);
  }

  private uploadBanner(arquivo: File): void {
    if (!this.usuario) return;

    this.carregandoBanner = true;
    this.usuarioService.atualizarBanner(this.usuario.id, arquivo).subscribe({
      next: usuario => {
        this.auth.atualizarUsuario(usuario);
        this.carregandoBanner = false;
        this.snackbar.open('Capa atualizada com sucesso.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.carregandoBanner = false;
        this.snackbar.open('Não foi possível atualizar a capa.', 'OK', { duration: 3000 });
      },
    });
  }

  removerBanner(): void {
    if (!this.usuario || !this.usuario.banner) return;

    this.carregandoBanner = true;
    this.usuarioService.removerBanner(this.usuario.id).subscribe({
      next: usuario => {
        this.auth.atualizarUsuario(usuario);
        this.carregandoBanner = false;
        this.snackbar.open('Capa removida.', 'OK', { duration: 3000 });
      },
      error: () => {
        this.carregandoBanner = false;
        this.snackbar.open('Não foi possível remover a capa.', 'OK', { duration: 3000 });
      },
    });
  }

  statusLabel(s: StatusTarefa): string { return STATUS_LABEL[s] || ''; }

  statusIcone(status: StatusTarefa): string {
    const icones: Record<number, string> = {
      [StatusTarefa.Backlog]: 'circle',
      [StatusTarefa.Fazer]: 'radio_button_unchecked',
      [StatusTarefa.Andamento]: 'autorenew',
      [StatusTarefa.Revisao]: 'visibility',
      [StatusTarefa.Feito]: 'check_circle',
      [StatusTarefa.Cancelado]: 'cancel',
    };
    return icones[status] || 'circle';
  }

  toggleStatusMenu(event: Event, tarefa: Tarefa) {
    event.stopPropagation();
    if (this.statusMenu?.id === tarefa.id) {
      this.statusMenu = null;
      return;
    }
    this.statusMenu = tarefa;
    const el = (event.target as HTMLElement).closest('.mini-status') ?? (event.target as HTMLElement);
    const rect = el.getBoundingClientRect();
    this.statusMenuPos = { top: rect.bottom + 6, left: rect.left - 90 };
  }

  @HostListener('document:click', ['$event'])
  fecharStatusMenu(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('.mini-status') || target.closest('.status-dropdown')) return;
    this.statusMenu = null;
  }

  alterarStatus(tarefa: Tarefa, status: StatusTarefa) {
    if (tarefa.status === status) return;
    const anterior = tarefa.status;
    tarefa.status = status;
    this.agrupar();
    this.cdr.detectChanges();

    this.tarefaService.mover({ id: tarefa.id, status, ordem: tarefa.ordem, usuarioId: this.auth.usuario()?.id }).subscribe({
      error: () => {
        tarefa.status = anterior;
        this.agrupar();
        this.cdr.detectChanges();
      },
    });
  }

  abrirTarefa(tarefa: Tarefa) {
    const dialogRef = this.dialog.open(TarefaDetalheModalComponent, {
      width: '1280px',
      maxWidth: '95vw',
      data: { tarefa, membros: [] },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const dto: TarefaSave = {
        titulo: result.titulo,
        descricao: result.descricao,
        status: result.status,
        prioridade: result.prioridade,
        tipo: result.tipo,
        projetoId: tarefa.projetoId,
        responsavelIds: result.responsavelIds || [],
        criadorId: tarefa.criadorId,
        atorId: this.auth.usuario()?.id,
        contatoNome: result.contatoNome ?? null,
        dataEntrega: result.dataEntrega ?? null,
      };
      this.tarefaService.atualizar(tarefa.id, dto).subscribe({
        next: () => this.recarregar(),
        error: err => console.error('Erro ao salvar:', err),
      });
    });
  }

  private carregar() {
    const usuarioId = this.auth.usuario()?.id;
    if (!usuarioId) {
      this.carregando = false;
      return;
    }
    this.carregando = true;
    this.tarefaService.listarPorResponsavel(usuarioId).subscribe({
      next: tarefas => {
        this.todasTarefas = tarefas;
        this.agrupar();
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar tarefas:', err);
        this.carregando = false;
      },
    });
  }

  private recarregar() {
    this.carregar();
  }

  private agrupar() {
    const ativas = this.todasTarefas.filter(t => t.status !== StatusTarefa.Feito && t.status !== StatusTarefa.Cancelado);
    const map = new Map<number, GrupoProjeto>();
    for (const t of ativas) {
      if (!map.has(t.projetoId)) {
        map.set(t.projetoId, { projetoId: t.projetoId, projetoNome: t.projetoNome, tarefas: [] });
      }
      map.get(t.projetoId)!.tarefas.push(t);
    }
    this.tarefasAgrupadas = Array.from(map.values());
  }
}
