import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout';
import { LoginComponent } from './features/auth/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { MeuDiaComponent } from './features/meu-dia/meu-dia';
import { ClientesListComponent } from './features/clientes/clientes-list';
import { ClienteDetalheComponent } from './features/clientes/cliente-detalhe';
import { CrmListComponent } from './features/crm/crm-list';
import { ProjetosListComponent } from './features/projetos/projetos-list';
import { KanbanComponent } from './features/tarefas/kanban';
import { TarefaDetalheComponent } from './features/tarefas/tarefa-detalhe-page';
import { ProjetoConfiguracoesComponent } from './features/projetos/projeto-configuracoes';
import { PerfilConfiguracoesComponent } from './features/perfil/perfil-configuracoes';
import { AdminConfiguracoesComponent } from './features/admin/admin-configuracoes';
import { LixeiraComponent } from './features/lixeira/lixeira';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
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
      { path: 'crm', component: CrmListComponent },
      { path: 'projetos', component: ProjetosListComponent },
      { path: 'projetos/:id/kanban', component: KanbanComponent },
      { path: 'projetos/:id/configuracoes', component: ProjetoConfiguracoesComponent },
      { path: 'tarefas/:chave', component: TarefaDetalheComponent },
      { path: 'lixeira', component: LixeiraComponent },
      { path: 'configuracoes', component: PerfilConfiguracoesComponent },
      { path: 'admin', component: AdminConfiguracoesComponent, canActivate: [AdminGuard] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
