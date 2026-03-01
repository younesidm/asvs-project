import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { TabsComponent } from './components/tabs/tabs';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'requirements', component: TabsComponent },
  { path: '**', redirectTo: '' }
];
