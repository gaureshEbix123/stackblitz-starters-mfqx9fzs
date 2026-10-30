import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './components/shared/loading/loading.component';
import { KeyboardAccessDirective } from './directive/keyboard-access.directive';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FormsModule,
    LoadingComponent,
    KeyboardAccessDirective,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'IntegraAngularUI';
}
