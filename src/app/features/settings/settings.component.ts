import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container">
      <h1>Configuración</h1>
      <mat-card>
        <mat-card-content>
          <p>Componente de Configuración en construcción...</p>
          <p>Aquí podrás configurar el nombre del equipo, logo y colores.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.container { max-width: 1200px; margin: 0 auto; }`]
})
export class SettingsComponent {}
