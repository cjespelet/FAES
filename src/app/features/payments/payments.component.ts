import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container">
      <h1>Gestión de Pagos</h1>
      <mat-card>
        <mat-card-content>
          <p>Componente de Pagos en construcción...</p>
          <p>Aquí podrás registrar pagos de torneos y seguros.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`.container { max-width: 1200px; margin: 0 auto; }`]
})
export class PaymentsComponent {}
