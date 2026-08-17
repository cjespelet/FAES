import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-players',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Gestión de Jugadores</h1>
        <button mat-raised-button color="primary">
          <mat-icon>person_add</mat-icon>
          Agregar Jugador
        </button>
      </div>
      
      <mat-card>
        <mat-card-content>
          <p>Componente de Jugadores en construcción...</p>
          <p>Aquí podrás:</p>
          <ul>
            <li>Agregar jugadores con DNI, nombre y teléfono</li>
            <li>Ver lista de jugadores activos e inactivos</li>
            <li>Editar información de jugadores</li>
            <li>Activar/desactivar jugadores</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      button {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
    
    ul {
      margin-top: 16px;
    }
  `]
})
export class PlayersComponent {}
