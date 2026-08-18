import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';

import { PlayerService } from '../../../core/services/player.service';
import { TournamentService } from '../../../core/services/tournament.service';
import { InsuranceService } from '../../../core/services/insurance.service';
import {
  countPendingInsurances,
  countPendingPayments,
  sumPaymentsThisMonth
} from '../../../core/utils/stats.utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
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
            <button mat-button color="primary" routerLink="/dashboard/players">Ver Todos</button>
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
            <button mat-button color="primary" routerLink="/dashboard/tournaments">Ver Torneos</button>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon payments">payment</mat-icon>
              <div>
                <h2>{{ monthlyRevenue() | currency:'ARS':'symbol-narrow':'1.0-0' }}</h2>
                <p>Recaudado este Mes</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/payments">Ver Pagos</button>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon reports">assessment</mat-icon>
              <div>
                <h2>{{ pendingPayments() }}</h2>
                <p>Cuotas Pendientes</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/reports">Ver Reportes</button>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon insurance">health_and_safety</mat-icon>
              <div>
                <h2>{{ pendingInsurances() }}</h2>
                <p>Seguros Pendientes</p>
              </div>
            </div>
            <button mat-button color="primary" routerLink="/dashboard/insurance">Ver Seguros</button>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-buttons">
          <button mat-raised-button color="primary" routerLink="/dashboard/players" [queryParams]="{ action: 'new' }">
            <mat-icon>person_add</mat-icon>
            Agregar Jugador
          </button>
          <button mat-raised-button color="accent" routerLink="/dashboard/tournaments" [queryParams]="{ action: 'new' }">
            <mat-icon>add_circle</mat-icon>
            Nuevo Torneo
          </button>
          <button mat-raised-button routerLink="/dashboard/payments" [queryParams]="{ action: 'new' }">
            <mat-icon>attach_money</mat-icon>
            Registrar Pago
          </button>
          <button mat-raised-button routerLink="/dashboard/insurance" [queryParams]="{ action: 'new' }">
            <mat-icon>health_and_safety</mat-icon>
            Nuevo Seguro
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container { max-width: 1200px; margin: 0 auto; }
    h1 { margin-bottom: 32px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }
    .stat-card mat-card-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .stat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .stat-icon.players { color: #3f51b5; }
    .stat-icon.tournaments { color: #ff9800; }
    .stat-icon.payments { color: #4caf50; }
    .stat-icon.reports { color: #f44336; }
    .stat-icon.insurance { color: #009688; }
    .stat-content div h2 { margin: 0; font-size: 1.75rem; }
    .stat-content div p { margin: 0; color: #666; }
    .quick-actions h2 { margin-bottom: 16px; }
    .actions-buttons {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .actions-buttons button {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class HomeComponent implements OnInit {
  private playerService = inject(PlayerService);
  private tournamentService = inject(TournamentService);
  private insuranceService = inject(InsuranceService);

  totalPlayers = signal(0);
  activeTournaments = signal(0);
  monthlyRevenue = signal(0);
  pendingPayments = signal(0);
  pendingInsurances = signal(0);

  ngOnInit(): void {
    combineLatest({
      players: this.playerService.getActivePlayers(),
      tournaments: this.tournamentService.getActiveTournaments(),
      payments: this.tournamentService.getAllPayments(),
      insurances: this.insuranceService.getInsurances()
    }).subscribe({
      next: ({ players, tournaments, payments, insurances }) => {
        this.totalPlayers.set(players.length);
        this.activeTournaments.set(tournaments.length);
        this.monthlyRevenue.set(sumPaymentsThisMonth(payments));
        this.pendingPayments.set(countPendingPayments(players, tournaments, payments));
        this.pendingInsurances.set(countPendingInsurances(insurances));
      }
    });
  }
}
