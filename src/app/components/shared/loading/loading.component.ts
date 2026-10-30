import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.css'],
})
export class LoadingComponent {
  /**
   * When true, loader is visible
   */
  @Input() show = false;

  /**
   * If true, loader covers full page with overlay
   */
  @Input() fullscreen = false;

  /**
   * Optional loading message
   */
  @Input() message = 'Loading...';
}
