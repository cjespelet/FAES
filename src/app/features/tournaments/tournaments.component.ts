import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container">
      <h1>Gestión de Torneos</h1>
      <mat-card>
        <mat-card-content>
          <p>Componente de Torneos en construcción...</p>
          <p>Aquí podrás gestionar Apertura y Clausura, configurar montos y cuotas.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.container { max-width: 1200px; margin: 0 auto; }`]
})
export class TournamentsComponent {}
