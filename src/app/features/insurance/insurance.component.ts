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

import { InsuranceService } from '../../core/services/insurance.service';
import { PlayerService } from '../../core/services/player.service';
import { Insurance } from '../../core/models/insurance.model';
import { Player } from '../../core/models/player.model';
import { toDate, toTimestamp } from '../../core/utils/date.utils';
import { InsuranceFormDialogComponent } from './insurance-form-dialog.component';

interface InsuranceRow extends Insurance {
  playerName: string;
}

@Component({
  selector: 'app-insurance',
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
        <h1>Seguros de Jugadores</h1>
        <button mat-raised-button color="primary" (click)="openForm()" [disabled]="players.length === 0">
          <mat-icon>health_and_safety</mat-icon>
          Nuevo Seguro
        </button>
      </div>

      @if (!loading && players.length === 0) {
        <mat-card><mat-card-content class="hint">Primero creá jugadores activos para registrar seguros.</mat-card-content></mat-card>
      }

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (insurances.length === 0) {
        <mat-card>
          <mat-card-content class="empty">
            <p>No hay seguros registrados.</p>
            @if (players.length > 0) {
              <button mat-raised-button color="primary" (click)="openForm()">Registrar seguro</button>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="insurances" class="table">
            <ng-container matColumnDef="player">
              <th mat-header-cell *matHeaderCellDef>Jugador</th>
              <td mat-cell *matCellDef="let i">{{ i.playerName }}</td>
            </ng-container>
            <ng-container matColumnDef="period">
              <th mat-header-cell *matHeaderCellDef>Período</th>
              <td mat-cell *matCellDef="let i">{{ i.period }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Monto</th>
              <td mat-cell *matCellDef="let i">{{ i.amount | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Vigencia</th>
              <td mat-cell *matCellDef="let i">{{ formatDate(i.startDate) }} – {{ formatDate(i.endDate) }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let i">
                <span class="chip" [class.paid]="i.paid" [class.pending]="!i.paid">
                  {{ i.paid ? 'Pagado' : 'Pendiente' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let i">
                @if (!i.paid) {
                  <button mat-icon-button (click)="markPaid(i)" title="Marcar pagado"><mat-icon>check_circle</mat-icon></button>
                }
                <button mat-icon-button (click)="openForm(i)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deleteInsurance(i)"><mat-icon>delete</mat-icon></button>
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
    .chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; }
    .chip.paid { background: #e8f5e9; color: #2e7d32; }
    .chip.pending { background: #fff3e0; color: #e65100; }
  `]
})
export class InsuranceComponent implements OnInit {
  private insuranceService = inject(InsuranceService);
  private playerService = inject(PlayerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  insurances: InsuranceRow[] = [];
  players: Player[] = [];
  loading = true;
  columns = ['player', 'period', 'amount', 'dates', 'status', 'actions'];

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
      insurances: this.insuranceService.getInsurances(),
      players: this.playerService.getActivePlayers()
    }).pipe(take(1)).subscribe({
      next: ({ insurances, players }) => {
        this.players = players;
        const playerMap = new Map(players.map(p => [p.id, p.name]));
        this.insurances = insurances.map(i => ({
          ...i,
          playerName: playerMap.get(i.playerId) ?? '—'
        }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al cargar seguros', 'Cerrar', { duration: 4000 });
      }
    });
  }

  openForm(insurance?: InsuranceRow): void {
    if (!insurance && this.players.length === 0) {
      this.snackBar.open('Creá jugadores primero', 'Cerrar', { duration: 4000 });
      return;
    }

    const ref = this.dialog.open(InsuranceFormDialogComponent, {
      width: '480px',
      data: { insurance, players: this.players }
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload: Record<string, unknown> = {
        playerId: result.playerId,
        period: result.period,
        amount: Number(result.amount),
        startDate: toTimestamp(result.startDate),
        endDate: toTimestamp(result.endDate),
        paid: result.paid,
        notes: result.notes || undefined
      };
      if (result.paid) {
        payload['paymentMethod'] = result.paymentMethod;
        payload['paymentDate'] = toTimestamp(result.paymentDate);
      }

      if (insurance) {
        this.insuranceService.updateInsurance(insurance.id, payload as any).subscribe({
          next: () => { this.snackBar.open('Seguro actualizado', 'Cerrar', { duration: 3000 }); this.loadData(); },
          error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 })
        });
      } else {
        this.insuranceService.addInsurance(payload as any).subscribe({
          next: () => { this.snackBar.open('Seguro creado', 'Cerrar', { duration: 3000 }); this.loadData(); },
          error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 })
        });
      }
    });
  }

  markPaid(insurance: InsuranceRow): void {
    this.insuranceService.markAsPaid(insurance.id, new Date(), 'Efectivo').subscribe({
      next: () => { this.snackBar.open('Seguro marcado como pagado', 'Cerrar', { duration: 3000 }); this.loadData(); },
      error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 4000 })
    });
  }

  deleteInsurance(insurance: InsuranceRow): void {
    if (!confirm(`¿Eliminar seguro de ${insurance.playerName}?`)) return;
    this.insuranceService.deleteInsurance(insurance.id).subscribe({
      next: () => { this.snackBar.open('Seguro eliminado', 'Cerrar', { duration: 3000 }); this.loadData(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 4000 })
    });
  }
}
