import { Routes } from '@angular/router';
import { authGuard, homeGuard } from './auth/auth.guards';
import { LoginComponent } from './auth/login/login.component';
import { ChangePasswordComponent } from './auth/change-password/change-password.component';
import { ClientsPageComponent } from './clients-page/clients-page.component';
import { AdminPageComponent } from './admin/admin-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [authGuard],
    data: { allowPendingPassword: true }
  },
  {
    path: 'clients',
    component: ClientsPageComponent,
    canActivate: [authGuard],
    data: { roles: ['STAFF'] }
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },
  { path: '**', redirectTo: '' }
];
