import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container">
      <h1>Reportes</h1>
      <mat-card>
        <mat-card-content>
          <p>Componente de Reportes en construcción...</p>
          <p>Aquí podrás generar reportes PDF/Excel de pagos pendientes.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.container { max-width: 1200px; margin: 0 auto; }`]
})
export class ReportsComponent {}
