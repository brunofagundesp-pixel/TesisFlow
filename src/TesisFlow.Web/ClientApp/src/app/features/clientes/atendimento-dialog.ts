import { Component, Inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SlicePipe, DatePipe } from '@angular/common';
import { Atendimento, STATUS_CONTATO_OPTIONS } from './clientes-data';
import { AuthUrlPipe } from '../../core/auth-url';
import { ClienteApiService } from './cliente-api.service';
import { TarefaService } from '../tarefas/tarefa.service';
import { HistoricoTarefaService } from '../tarefas/historico-tarefa.service';
import { AnexoService } from '../tarefas/anexo.service';
import { Tarefa, HistoricoTarefa, Anexo } from '../../core/models';

interface EventoHistorico {
  icon: string;
  mensagem: string;
  autor: string;
  data: string;
  timestamp: number;
}

@Component({
  selector: 'app-atendimento-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatExpansionModule, MatTooltipModule,
    FormsModule, SlicePipe, DatePipe, TextFieldModule, MatSnackBarModule,
    AuthUrlPipe, RouterLink,
  ],
  templateUrl: './atendimento-dialog.html',
  styleUrl: './atendimento-dialog.scss',
})
export class AtendimentoDialogComponent implements OnInit {
  readonly statusOptions = STATUS_CONTATO_OPTIONS;
  readonly apiUrl = 'http://localhost:5051/api';

  editando: Atendimento;

  tarefa?: Tarefa;
  historico: HistoricoTarefa[] = [];
  anexos: Anexo[] = [];
  carregando = true;
  temVinculo = false;

  private pendentes = 0;

  constructor(
    private dialogRef: MatDialogRef<AtendimentoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { atendimento: Atendimento; idColegio: number },
    private tarefaService: TarefaService,
    private historicoService: HistoricoTarefaService,
    private anexoService: AnexoService,
    private clienteApiService: ClienteApiService,
    private snackbar: MatSnackBar,
  ) {
    this.editando = { ...data.atendimento };
  }

  ngOnInit(): void {
    const protocolo = (this.data.atendimento.protocolo || '').trim();
    if (!protocolo) {
      this.carregando = false;
      this.temVinculo = false;
      return;
    }

    this.tarefaService.obterPorChave(protocolo).subscribe({
      next: (tarefa) => {
        this.tarefa = tarefa;
        this.temVinculo = true;
        this.pendentes = 2;

        this.historicoService.listar(tarefa.id).subscribe({
          next: (h) => { this.historico = h; this.verificar(); },
          error: () => this.verificar(),
        });

        this.anexoService.listar(tarefa.id).subscribe({
          next: (a) => { this.anexos = a; this.verificar(); },
          error: () => this.verificar(),
        });
      },
      error: () => {
        this.carregando = false;
        this.temVinculo = false;
      },
    });
  }

  private verificar(): void {
    this.pendentes--;
    if (this.pendentes <= 0) {
      this.carregando = false;
    }
  }

  get timeline(): EventoHistorico[] {
    const eventos: EventoHistorico[] = [];

    if (this.tarefa) {
      eventos.push({
        icon: 'add_circle',
        mensagem: `<strong>${this.tarefa.criadorNome}</strong> criou esta tarefa`,
        autor: this.tarefa.criadorNome,
        data: this.tarefa.dataCriacao,
        timestamp: new Date(this.tarefa.dataCriacao).getTime(),
      });
    }

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

    return eventos.sort((a, b) => b.timestamp - a.timestamp);
  }

  formatarTamanho(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  fechar() {
    this.dialogRef.close();
  }

  salvar() {
    const payload = {
      idContato: this.editando.id,
      idColegio: this.data.idColegio,
      dataContato: this.formatarDataContato(this.editando.data),
      idStatusContato: this.editando.idStatusContato,
      referencia: this.editando.titulo,
      nomeContato: this.editando.nomeContato || null,
      detalhes: this.editando.descricao || null,
      protocoloComentario: this.editando.protocolo || null,
    };

    this.clienteApiService.salvarContato(payload).subscribe({
      next: () => this.dialogRef.close(this.editando),
      error: (err) => {
        console.error('Erro ao salvar atendimento', err);
        this.snackbar.open('Não foi possível salvar o atendimento.', 'OK', { duration: 4000 });
      },
    });
  }

  private formatarDataContato(data: string): string {
    if (!data) return '';
    const partes = data.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]} 00:00:00`;
    }
    return data;
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const partes = data.split('-');
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
}
