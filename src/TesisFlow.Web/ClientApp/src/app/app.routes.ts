import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout';
import { LoginComponent } from './features/auth/login';
import { RegistroComponent } from './features/auth/registro';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ClientesListComponent } from './features/clientes/clientes-list';
import { ClienteDetalheComponent } from './features/clientes/cliente-detalhe';
import { ProjetosListComponent } from './features/projetos/projetos-list';
import { KanbanComponent } from './features/tarefas/kanban';
import { TarefaDetalheComponent } from './features/tarefas/tarefa-detalhe-page';
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
      { path: 'clientes', component: ClientesListComponent },
      { path: 'clientes/:id', component: ClienteDetalheComponent },
      { path: 'projetos', component: ProjetosListComponent },
      { path: 'projetos/:id/kanban', component: KanbanComponent },
      { path: 'tarefas/:chave', component: TarefaDetalheComponent },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
