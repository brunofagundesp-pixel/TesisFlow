import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout';
import { LoginComponent } from './features/auth/login';
import { RegistroComponent } from './features/auth/registro';
import { DashboardComponent } from './features/dashboard/dashboard';
import { MeuDiaComponent } from './features/meu-dia/meu-dia';
import { ClientesListComponent } from './features/clientes/clientes-list';
import { ClienteDetalheComponent } from './features/clientes/cliente-detalhe';
import { ProjetosListComponent } from './features/projetos/projetos-list';
import { KanbanComponent } from './features/tarefas/kanban';
import { TarefaDetalheComponent } from './features/tarefas/tarefa-detalhe-page';
import { ProjetoConfiguracoesComponent } from './features/projetos/projeto-configuracoes';
import { PerfilConfiguracoesComponent } from './features/perfil/perfil-configuracoes';
import { LixeiraComponent } from './features/lixeira/lixeira';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'meu-dia', component: MeuDiaComponent },
      { path: 'clientes', component: ClientesListComponent },
      { path: 'clientes/:id', component: ClienteDetalheComponent },
      { path: 'projetos', component: ProjetosListComponent },
      { path: 'projetos/:id/kanban', component: KanbanComponent },
      { path: 'projetos/:id/configuracoes', component: ProjetoConfiguracoesComponent },
      { path: 'tarefas/:chave', component: TarefaDetalheComponent },
      { path: 'lixeira', component: LixeiraComponent },
      { path: 'configuracoes', component: PerfilConfiguracoesComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
