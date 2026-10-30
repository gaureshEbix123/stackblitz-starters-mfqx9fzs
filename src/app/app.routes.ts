import { Routes } from '@angular/router';
import { JqwidgetTestComponent } from './components/jqwidget-test/jqwidget-test.component';
export const routes: Routes = [
  { path: '', redirectTo: 'jqxwidget-test', pathMatch: 'full' },
  { path: 'jqxwidget-test', component: JqwidgetTestComponent },
];
