import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterModule } from '@angular/router';

import { PlayerService } from '../../../core/services/player.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { Player } from '../../../core/models/player.model';
import { Tournament } from '../../../core/models/tournament.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule
  ],
  template: `
    <div class="home-container">
      <h1>Dashboard de Gestión</h1>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon players">people</mat-icon>
              <div>
                <h2>{{ totalPlayers() }}</h2>
                <p>Jugadores Activos</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/players">
              Ver Todos
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon tournaments">emoji_events</mat-icon>
              <div>
                <h2>{{ activeTournaments() }}</h2>
                <p>Torneos Activos</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/tournaments">
              Ver Torneos
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon payments">payment</mat-icon>
              <div>
                <h2>$0</h2>
                <p>Recaudado este Mes</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/payments">
              Ver Pagos
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon reports">assessment</mat-icon>
              <div>
                <h2>0</h2>
                <p>Pagos Pendientes</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/reports">
              Ver Reportes
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-buttons">
          <button mat-raised-button color="primary" routerLink="/dashboard/players">
            <mat-icon>person_add</mat-icon>
            Agregar Jugador
          </button>
          <button mat-raised-button color="accent" routerLink="/dashboard/tournaments">
            <mat-icon>add_circle</mat-icon>
            Nuevo Torneo
          </button>
          <button mat-raised-button routerLink="/dashboard/payments">
            <mat-icon>attach_money</mat-icon>
            Registrar Pago
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }

    .stat-card {
      mat-card-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    }

    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .stat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        
        &.players { color: #3f51b5; }
        &.tournaments { color: #ff9800; }
        &.payments { color: #4caf50; }
        &.reports { color: #f44336; }
      }
      
      div {
        h2 {
          margin: 0;
          font-size: 2rem;
        }
        
        p {
          margin: 0;
          color: #666;
        }
      }
    }

    .quick-actions {
      h2 {
        margin-bottom: 16px;
      }
      
      .actions-buttons {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        
        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private playerService = inject(PlayerService);
  private tournamentService = inject(TournamentService);

  totalPlayers = signal(0);
  activeTournaments = signal(0);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.playerService.getActivePlayers().subscribe({
      next: (players: Player[]) => {
        this.totalPlayers.set(players.length);
      }
    });

    this.tournamentService.getActiveTournaments().subscribe({
      next: (tournaments: Tournament[]) => {
        this.activeTournaments.set(tournaments.length);
      }
    });
  }
}
