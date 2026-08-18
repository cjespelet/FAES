import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PlayerService } from '../../core/services/player.service';
import { Player } from '../../core/models/player.model';
import { toTimestamp, omitUndefined } from '../../core/utils/date.utils';
import { PlayerFormDialogComponent } from './player-form-dialog.component';

@Component({
  selector: 'app-players',
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
        <h1>Gestión de Jugadores</h1>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>person_add</mat-icon>
          Agregar Jugador
        </button>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (players.length === 0) {
        <mat-card>
          <mat-card-content class="empty">
            <p>No hay jugadores registrados.</p>
            <button mat-raised-button color="primary" (click)="openForm()">Agregar el primero</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="players" class="table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let p">{{ p.name }}</td>
            </ng-container>
            <ng-container matColumnDef="dni">
              <th mat-header-cell *matHeaderCellDef>DNI</th>
              <td mat-cell *matCellDef="let p">{{ p.dni }}</td>
            </ng-container>
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Teléfono</th>
              <td mat-cell *matCellDef="let p">{{ p.phone }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let p">
                <span class="chip" [class.active]="p.active" [class.inactive]="!p.active">
                  {{ p.active ? 'Activo' : 'Inactivo' }}
                </span>
                @if (p.paymentExempt) {
                  <span class="chip exempt">Liberado</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button (click)="openForm(p)" title="Editar"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button (click)="toggleStatus(p)" title="Cambiar estado">
                  <mat-icon>{{ p.active ? 'person_off' : 'person' }}</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deletePlayer(p)" title="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
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
    .chip.inactive { background: #ffebee; color: #c62828; }
    .chip.exempt { background: #fff8e1; color: #f57f17; margin-left: 6px; }
  `]
})
export class PlayersComponent implements OnInit {
  private playerService = inject(PlayerService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  players: Player[] = [];
  loading = true;
  columns = ['name', 'dni', 'phone', 'status', 'actions'];

  ngOnInit(): void {
    this.loadPlayers();
    if (this.route.snapshot.queryParamMap.get('action') === 'new') {
      setTimeout(() => this.openForm(), 300);
    }
  }

  loadPlayers(): void {
    this.loading = true;
    this.playerService.getPlayers().subscribe({
      next: (players) => { this.players = players; this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Error al cargar jugadores', 'Cerrar', { duration: 4000 }); }
    });
  }

  openForm(player?: Player): void {
    const ref = this.dialog.open(PlayerFormDialogComponent, { width: '480px', data: { player } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const payload = omitUndefined({
        dni: result.dni,
        name: result.name,
        phone: result.phone,
        email: result.email || undefined,
        joinedDate: toTimestamp(result.joinedDate),
        notes: result.notes || undefined,
        active: result.active,
        paymentExempt: !!result.paymentExempt
      });
      if (player) {
        this.playerService.updatePlayer(player.id, payload as any).subscribe({
          next: () => { this.snackBar.open('Jugador actualizado', 'Cerrar', { duration: 3000 }); this.loadPlayers(); },
          error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 })
        });
      } else {
        this.playerService.addPlayer(payload as any).subscribe({
          next: () => { this.snackBar.open('Jugador creado', 'Cerrar', { duration: 3000 }); this.loadPlayers(); },
          error: () => this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 })
        });
      }
    });
  }

  toggleStatus(player: Player): void {
    this.playerService.togglePlayerStatus(player.id, !player.active).subscribe({
      next: () => this.loadPlayers(),
      error: () => this.snackBar.open('Error al cambiar estado', 'Cerrar', { duration: 4000 })
    });
  }

  deletePlayer(player: Player): void {
    if (!confirm(`¿Eliminar a ${player.name}?`)) return;
    this.playerService.deletePlayer(player.id).subscribe({
      next: () => { this.snackBar.open('Jugador eliminado', 'Cerrar', { duration: 3000 }); this.loadPlayers(); },
      error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 4000 })
    });
  }
}
