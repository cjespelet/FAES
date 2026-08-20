import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, take } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TournamentService } from '../../core/services/tournament.service';
import { PlayerService } from '../../core/services/player.service';
import { Tournament, TournamentPayment } from '../../core/models/tournament.model';
import { Player } from '../../core/models/player.model';
import { toDate, toTimestamp, omitUndefined } from '../../core/utils/date.utils';
import { payingPlayers } from '../../core/utils/payment.utils';
import { PaymentFormDialogComponent } from './payment-form-dialog.component';

interface PaymentRow extends TournamentPayment {
  playerName: string;
  tournamentName: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Gestión de Pagos</h1>
        <button mat-raised-button color="primary" (click)="openForm()" [disabled]="!canAdd">
          <mat-icon>attach_money</mat-icon>
          Registrar Pago
        </button>
      </div>
      <p class="page-hint">Podés cargar varios pagos para la misma cuota hasta completarla.</p>

      @if (!canAdd && !loading) {
        <mat-card><mat-card-content class="hint">
          Necesitás al menos un jugador que pague (no liberado) y un torneo para registrar pagos.
        </mat-card-content></mat-card>
      }

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (payments.length === 0) {
        <mat-card>
          <mat-card-content class="empty">
            <p>No hay pagos registrados.</p>
            @if (canAdd) {
              <button mat-raised-button color="primary" (click)="openForm()">Registrar el primero</button>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="payments" class="table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let p">{{ formatDate(p.paymentDate) }}</td>
            </ng-container>
            <ng-container matColumnDef="player">
              <th mat-header-cell *matHeaderCellDef>Jugador</th>
              <td mat-cell *matCellDef="let p">{{ p.playerName }}</td>
            </ng-container>
            <ng-container matColumnDef="tournament">
              <th mat-header-cell *matHeaderCellDef>Torneo</th>
              <td mat-cell *matCellDef="let p">{{ p.tournamentName }}</td>
            </ng-container>
            <ng-container matColumnDef="installment">
              <th mat-header-cell *matHeaderCellDef>Cuota</th>
              <td mat-cell *matCellDef="let p">{{ p.installmentNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Monto</th>
              <td mat-cell *matCellDef="let p">{{ p.amount | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="method">
              <th mat-header-cell *matHeaderCellDef>Método</th>
              <td mat-cell *matCellDef="let p">{{ p.paymentMethod }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="openForm(p)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deletePayment(p)"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header button { display: flex; align-items: center; gap: 8px; }
    .loading, .empty, .hint { padding: 24px; text-align: center; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .table { width: 100%; }
    .page-hint { margin: -12px 0 20px; color: #666; }
  `]
})
export class PaymentsComponent implements OnInit {
  private tournamentService = inject(TournamentService);
  private playerService = inject(PlayerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  payments: PaymentRow[] = [];
  players: Player[] = [];
  tournaments: Tournament[] = [];
  loading = true;
  columns = ['date', 'player', 'tournament', 'installment', 'amount', 'method', 'actions'];

  get canAdd(): boolean {
    return payingPlayers(this.players).length > 0 && this.tournaments.length > 0;
  }

  ngOnInit(): void {
    this.loadData();
    if (this.route.snapshot.queryParamMap.get('action') === 'new') {
      setTimeout(() => this.openForm(), 500);
    }
  }

  formatDate(value: unknown): string {
    return toDate(value).toLocaleDateString('es-AR');
  }

  loadData(): void {
    this.loading = true;
    combineLatest({
      payments: this.tournamentService.getAllPayments(),
      players: this.playerService.getActivePlayers(),
      tournaments: this.tournamentService.getTournaments()
    }).pipe(take(1)).subscribe({
      next: ({ payments, players, tournaments }) => {
        this.players = players;
        this.tournaments = tournaments;
        const playerMap = new Map(players.map(p => [p.id, p.name]));
        const tournamentMap = new Map(tournaments.map(t => [t.id, t.name]));
        this.payments = payments.map(p => ({
          ...p,
          playerName: playerMap.get(p.playerId) ?? '—',
          tournamentName: tournamentMap.get(p.tournamentId) ?? '—'
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err?.message ? `Error al cargar pagos: ${err.message}` : 'Error al cargar pagos', 'Cerrar', { duration: 6000 });
      }
    });
  }

  openForm(payment?: PaymentRow): void {
    if (!this.canAdd && !payment) {
      this.snackBar.open('Creá jugadores y torneos primero', 'Cerrar', { duration: 4000 });
      return;
    }

    const ref = this.dialog.open(PaymentFormDialogComponent, {
      width: '480px',
      data: { payment, players: this.players, tournaments: this.tournaments, payments: this.payments }
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload = omitUndefined({
        tournamentId: result.tournamentId,
        playerId: result.playerId,
        installmentNumber: Number(result.installmentNumber),
        amount: Number(result.amount),
        paymentMethod: result.paymentMethod,
        paymentDate: toTimestamp(result.paymentDate),
        notes: result.notes || undefined
      });
      if (payment) {
        this.tournamentService.updatePayment(payment.id, payload as any).subscribe({
          next: () => { this.snackBar.open('Pago guardado', 'Cerrar', { duration: 3000 }); this.loadData(); },
          error: (err) => this.snackBar.open(err?.message ? `Error al guardar pago: ${err.message}` : 'Error al guardar pago', 'Cerrar', { duration: 6000 })
        });
      } else {
        this.tournamentService.addPayment(payload as any).subscribe({
          next: () => { this.snackBar.open('Pago guardado', 'Cerrar', { duration: 3000 }); this.loadData(); },
          error: (err) => this.snackBar.open(err?.message ? `Error al guardar pago: ${err.message}` : 'Error al guardar pago', 'Cerrar', { duration: 6000 })
        });
      }
    });
  }

  deletePayment(payment: PaymentRow): void {
    if (!confirm('¿Eliminar este pago?')) return;
    this.tournamentService.deletePayment(payment.id).subscribe({
      next: () => { this.snackBar.open('Pago eliminado', 'Cerrar', { duration: 3000 }); this.loadData(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 4000 })
    });
  }
}
