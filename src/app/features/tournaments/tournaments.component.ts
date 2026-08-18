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
import { Tournament } from '../../core/models/tournament.model';
import { toDate, toTimestamp, omitUndefined } from '../../core/utils/date.utils';
import { installmentForPayers, tournamentShare } from '../../core/utils/payment.utils';
import { TournamentFormDialogComponent } from './tournament-form-dialog.component';

@Component({
  selector: 'app-tournaments',
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
        <h1>Gestión de Torneos</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add_circle</mat-icon>
          Nuevo Torneo
        </button>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (tournaments.length === 0) {
        <mat-card>
          <mat-card-content class="empty">
            <p>No hay torneos registrados.</p>
            <button mat-raised-button color="primary" (click)="openForm()">Crear torneo</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="tournaments" class="table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Torneo</th>
              <td mat-cell *matCellDef="let t">{{ t.name }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let t">{{ t.type }} {{ t.year }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Monto / Cuotas</th>
              <td mat-cell *matCellDef="let t">
                {{ t.totalAmount | currency:'ARS':'symbol-narrow':'1.0-0' }}
                @if (payingCount > 0) {
                  <span class="split">
                    ÷ {{ payingCount }} = {{ shareFor(t) | currency:'ARS':'symbol-narrow':'1.0-0' }}
                    ({{ t.installments }} x {{ cuotaFor(t) | currency:'ARS':'symbol-narrow':'1.0-0' }})
                  </span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Período</th>
              <td mat-cell *matCellDef="let t">{{ formatDate(t.startDate) }} – {{ formatDate(t.endDate) }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let t">
                <span class="chip" [class.active]="t.active">{{ t.active ? 'Activo' : 'Inactivo' }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let t">
                <button mat-icon-button (click)="openForm(t)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deleteTournament(t)"><mat-icon>delete</mat-icon></button>
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
    .loading, .empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px; }
    .table { width: 100%; }
    .chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; }
    .chip.active { background: #e8f5e9; color: #2e7d32; }
    .chip:not(.active) { background: #f5f5f5; color: #666; }
    .split { display: block; font-size: 12px; color: #666; }
  `]
})
export class TournamentsComponent implements OnInit {
  private tournamentService = inject(TournamentService);
  private playerService = inject(PlayerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  tournaments: Tournament[] = [];
  payingCount = 0;
  loading = true;
  columns = ['name', 'type', 'amount', 'dates', 'status', 'actions'];

  ngOnInit(): void {
    this.loadTournaments();
    if (this.route.snapshot.queryParamMap.get('action') === 'new') {
      setTimeout(() => this.openForm(), 300);
    }
  }

  formatDate(value: unknown): string {
    return toDate(value).toLocaleDateString('es-AR');
  }

  shareFor(tournament: Tournament): number {
    return tournamentShare(tournament.totalAmount, this.payingCount);
  }

  cuotaFor(tournament: Tournament): number {
    return installmentForPayers(tournament, this.payingCount);
  }

  loadTournaments(): void {
    this.loading = true;
    combineLatest({
      tournaments: this.tournamentService.getTournaments(),
      players: this.playerService.getActivePlayers()
    }).pipe(take(1)).subscribe({
      next: ({ tournaments, players }) => {
        this.tournaments = tournaments;
        this.payingCount = players.filter(p => !p.paymentExempt).length;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(this.errorMessage(err, 'Error al cargar torneos'), 'Cerrar', { duration: 6000 });
      }
    });
  }

  openForm(tournament?: Tournament): void {
    const ref = this.dialog.open(TournamentFormDialogComponent, { width: '520px', data: { tournament } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      try {
        const totalAmount = Number(result.totalAmount);
        const installments = Number(result.installments);
        const payload = omitUndefined({
          name: result.name,
          type: result.type,
          year: Number(result.year),
          totalAmount,
          installments,
          installmentAmount: totalAmount / installments,
          startDate: toTimestamp(result.startDate),
          endDate: toTimestamp(result.endDate),
          installmentDueDates: (result.dueDates ?? [])
            .filter((d: unknown) => !!d)
            .map((d: Date) => toTimestamp(d)),
          active: result.active ?? true
        });
        if (tournament) {
          this.tournamentService.updateTournament(tournament.id, payload as any).subscribe({
            next: () => { this.snackBar.open('Torneo actualizado', 'Cerrar', { duration: 3000 }); this.loadTournaments(); },
            error: (err) => this.snackBar.open(this.errorMessage(err, 'Error al guardar'), 'Cerrar', { duration: 6000 })
          });
        } else {
          this.tournamentService.addTournament(payload as any).subscribe({
            next: () => { this.snackBar.open('Torneo creado', 'Cerrar', { duration: 3000 }); this.loadTournaments(); },
            error: (err) => this.snackBar.open(this.errorMessage(err, 'Error al guardar'), 'Cerrar', { duration: 6000 })
          });
        }
      } catch (err) {
        this.snackBar.open(this.errorMessage(err, 'Error al guardar'), 'Cerrar', { duration: 6000 });
      }
    });
  }

  deleteTournament(tournament: Tournament): void {
    if (!confirm(`¿Eliminar el torneo "${tournament.name}"?`)) return;
    this.tournamentService.deleteTournament(tournament.id).subscribe({
      next: () => { this.snackBar.open('Torneo eliminado', 'Cerrar', { duration: 3000 }); this.loadTournaments(); },
      error: (err) => this.snackBar.open(this.errorMessage(err, 'Error al eliminar'), 'Cerrar', { duration: 6000 })
    });
  }

  private errorMessage(err: unknown, fallback: string): string {
    const e = err as { code?: string; message?: string };
    if (e?.code === 'permission-denied') return 'Sin permiso para escribir en Firestore.';
    if (e?.code === 'unauthenticated') return 'Sesión vencida. Volvé a iniciar sesión.';
    if (e?.message) return e.message;
    return fallback;
  }
}
