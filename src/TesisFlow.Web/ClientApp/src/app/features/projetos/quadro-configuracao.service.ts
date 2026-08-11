import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { QuadroConfiguracao, QuadroConfiguracaoSave } from '../../core/models';

@Injectable({ providedIn: 'root' })
export class QuadroConfiguracaoService {
  constructor(private api: ApiService) {}

  listarPorProjeto(projetoId: number): Observable<QuadroConfiguracao[]> {
    return this.api.get<QuadroConfiguracao[]>(`QuadroConfiguracoes/projeto/${projetoId}`);
  }

  criarParaProjeto(projetoId: number, dtos: QuadroConfiguracaoSave[]): Observable<QuadroConfiguracao[]> {
    return this.api.post<QuadroConfiguracao[]>(`QuadroConfiguracoes/projeto/${projetoId}`, dtos);
  }

  atualizar(id: number, dto: QuadroConfiguracaoSave): Observable<QuadroConfiguracao> {
    return this.api.put<QuadroConfiguracao>(`QuadroConfiguracoes/${id}`, dto);
  }
}
