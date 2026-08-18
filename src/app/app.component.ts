import { Component, inject } from '@angular/core';
import { NavigationError, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'FAES';
  navError = '';

  constructor() {
    inject(Router).events.subscribe(event => {
      if (event instanceof NavigationError) {
        this.navError = event.error?.message || String(event.error || 'Error de navegación');
        console.error(event.error);
      }
    });
  }
}
