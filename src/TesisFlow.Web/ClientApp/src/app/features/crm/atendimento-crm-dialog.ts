import { Component, Inject, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TextFieldModule } from '@angular/cdk/text-field';
import {
  AtendimentoCrm, AtendimentoCrmPayload, Contato,
  TIPO_INTERACAO_OPTIONS, CANAL_OPTIONS, RESULTADO_OPTIONS,
} from './crm-data';
import { CrmService } from './crm.service';
import { ClienteApiService } from '../clientes/cliente-api.service';
import { Cliente } from '../clientes/clientes-data';

@Component({
  selector: 'app-atendimento-crm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TextFieldModule,
    FormsModule,
    MatSnackBarModule,
  ],
  templateUrl: './atendimento-crm-dialog.html',
  styleUrl: './atendimento-crm-dialog.scss',
})
export class AtendimentoCrmDialogComponent implements OnInit {
  readonly tipoOptions = TIPO_INTERACAO_OPTIONS;
  readonly canalOptions = CANAL_OPTIONS;
  readonly resultadoOptions = RESULTADO_OPTIONS;

  titulo = '';
  descricao = '';
  status = 0;
  tipoInteracao: number | null = null;
  canal: number | null = null;
  resultado: number | null = null;
  contatoId: number | null = null;
  nomeContato = '';
  atendimentoOrigemId: number | null = null;

  proximoContatoData = '';
  proximoContatoHora = '';
  proximoContatoMotivo = '';
  retornoConcluido = false;

  colegioId = 0;
  colegioNome = '';
  escolaFixa = false;

  escolas: Cliente[] = [];
  escolaBusca = '';
  mostrarEscolas = false;

  contatos: Contato[] = [];

  novoContatoAberto = false;
  novoContatoNome = '';
  novoContatoTelefone = '';
  novoContatoEmail = '';
  novoContatoCargo = '';

  salvando = false;

  constructor(
    private dialogRef: MatDialogRef<AtendimentoCrmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { atendimento?: AtendimentoCrm | null; colegioId?: number; colegioNome?: string; origem?: AtendimentoCrm | null },
    private crmService: CrmService,
    private clienteApiService: ClienteApiService,
    private snackbar: MatSnackBar,
  ) {
    if (data.colegioId) {
      this.escolaFixa = true;
      this.colegioId = data.colegioId;
      this.colegioNome = data.colegioNome || '';
    }

    if (data.atendimento) {
      const a = data.atendimento;
      this.titulo = a.titulo;
      this.descricao = a.descricao;
      this.status = a.status;
      this.tipoInteracao = a.tipoInteracao;
      this.canal = a.canal;
      this.resultado = a.resultado;
      this.contatoId = a.contatoId;
      this.nomeContato = a.nomeContato || '';
      this.proximoContatoData = a.proximoContatoData ? a.proximoContatoData.split('T')[0] : '';
      this.proximoContatoHora = a.proximoContatoHora || '';
      this.proximoContatoMotivo = a.proximoContatoMotivo || '';
      this.retornoConcluido = a.retornoConcluido;
      this.colegioId = a.colegioId;
      this.colegioNome = a.colegioNome;
      this.escolaFixa = true;
    }

    if (data.origem) {
      const o = data.origem;
      this.escolaFixa = true;
      this.colegioId = o.colegioId;
      this.colegioNome = o.colegioNome;
      this.contatoId = o.contatoId;
      this.nomeContato = o.nomeContato || '';
      this.atendimentoOrigemId = o.id;
      this.tipoInteracao = 1;
    }
  }

  ngOnInit(): void {
    if (!this.escolaFixa) {
      this.clienteApiService.listarAtivos().subscribe({
        next: (escolas) => this.escolas = escolas,
        error: () => this.escolas = [],
      });
    }

    if (this.colegioId) this.carregarContatos();
  }

  get escolasFiltradas(): Cliente[] {
    const t = this.escolaBusca.toLowerCase().trim();
    if (!t) return this.escolas.slice(0, 30);
    return this.escolas
      .filter(e => e.nome.toLowerCase().includes(t) || e.apelido.toLowerCase().includes(t))
      .slice(0, 30);
  }

  selecionarEscola(c: Cliente): void {
    this.colegioId = c.id;
    this.colegioNome = c.nome;
    this.escolaBusca = '';
    this.mostrarEscolas = false;
    this.contatoId = null;
    this.nomeContato = '';
    this.contatos = [];
    this.carregarContatos();
  }

  carregarContatos(): void {
    if (!this.colegioId) return;
    this.crmService.listarContatos(this.colegioId).subscribe({
      next: (contatos) => this.contatos = contatos,
      error: () => this.contatos = [],
    });
  }

  onContatoChange(): void {
    const c = this.contatos.find(x => x.id === this.contatoId);
    this.nomeContato = c ? c.nome : '';
  }

  abrirNovoContato(): void {
    this.novoContatoAberto = true;
    this.novoContatoNome = '';
    this.novoContatoTelefone = '';
    this.novoContatoEmail = '';
    this.novoContatoCargo = '';
  }

  cancelarNovoContato(): void {
    this.novoContatoAberto = false;
  }

  salvarNovoContato(): void {
    if (!this.colegioId || !this.novoContatoNome.trim()) return;

    this.crmService.criarContato({
      colegioId: this.colegioId,
      nome: this.novoContatoNome.trim(),
      telefone: this.novoContatoTelefone.trim() || null,
      email: this.novoContatoEmail.trim() || null,
      cargo: this.novoContatoCargo.trim() || null,
    }).subscribe({
      next: (c) => {
        this.contatos = [...this.contatos, c];
        this.contatoId = c.id;
        this.nomeContato = c.nome;
        this.novoContatoAberto = false;
      },
      error: () => this.snackbar.open('Não foi possível salvar o contato.', 'OK', { duration: 4000 }),
    });
  }

  get tituloDialog(): string {
    if (this.data.atendimento) return 'Editar atendimento';
    if (this.data.origem) return 'Registrar novo atendimento';
    return 'Novo atendimento';
  }

  salvar(): void {
    if (!this.titulo.trim()) {
      this.snackbar.open('Informe o título do atendimento.', 'OK', { duration: 4000 });
      return;
    }
    if (!this.colegioId) {
      this.snackbar.open('Selecione a escola.', 'OK', { duration: 4000 });
      return;
    }

    const proximoContatoData = this.proximoContatoData
      ? new Date(this.proximoContatoData + 'T00:00:00').toISOString()
      : null;

    const payload: AtendimentoCrmPayload = {
      colegioId: this.colegioId,
      colegioNome: this.colegioNome,
      titulo: this.titulo.trim(),
      descricao: this.descricao.trim(),
      status: this.status,
      nomeContato: this.nomeContato || null,
      tipoInteracao: this.tipoInteracao,
      canal: this.canal,
      resultado: this.resultado,
      contatoId: this.contatoId,
      atendimentoOrigemId: this.atendimentoOrigemId,
      proximoContatoData,
      proximoContatoHora: this.proximoContatoHora || null,
      proximoContatoMotivo: this.proximoContatoMotivo.trim() || null,
      retornoConcluido: this.retornoConcluido,
    };

    this.salvando = true;
    const req = this.data.atendimento
      ? this.crmService.atualizar(this.data.atendimento.id, payload)
      : this.crmService.criar(payload);

    req.subscribe({
      next: (res) => {
        this.salvando = false;
        this.dialogRef.close(res);
      },
      error: () => {
        this.salvando = false;
        this.snackbar.open('Não foi possível salvar o atendimento.', 'OK', { duration: 4000 });
      },
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }

  @HostListener('document:click', ['$event'])
  fecharDropdown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.escola-selector')) {
      this.mostrarEscolas = false;
    }
  }
}
