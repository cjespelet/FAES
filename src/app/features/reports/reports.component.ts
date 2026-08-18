import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, take } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { PlayerService } from '../../core/services/player.service';
import { TournamentService } from '../../core/services/tournament.service';
import { InsuranceService } from '../../core/services/insurance.service';
import { TeamService } from '../../core/services/team.service';
import { Player } from '../../core/models/player.model';
import { Tournament, TournamentPayment } from '../../core/models/tournament.model';
import { Team } from '../../core/models/team.model';
import { Insurance } from '../../core/models/insurance.model';
import {
  buildInitialSchedule,
  buildPaymentStatus,
  buildPendingPaymentRows,
  initialScheduleHeaders,
  InitialScheduleRow,
  PaymentStatusRow,
  PendingPaymentRow
} from '../../core/utils/stats.utils';
import { formatMoney } from '../../core/utils/date.utils';
import { exemptionLabel } from '../../core/utils/payment.utils';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <h1>Reportes</h1>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>Reporte inicial (para WhatsApp)</mat-card-title>
            <mat-card-subtitle>
              Listado de jugadores, cuotas con vencimiento y seguro. Pensado para mandar al grupo.
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (tournaments.length === 0 || schedule.length === 0) {
              <p class="empty">
                Necesitás jugadores activos y un torneo para generar este reporte.
              </p>
            } @else {
              <div class="toolbar">
                <mat-form-field appearance="outline">
                  <mat-label>Torneo</mat-label>
                  <mat-select [(ngModel)]="selectedTournamentId" (selectionChange)="rebuildSchedule()">
                    @for (t of tournaments; track t.id) {
                      <mat-option [value]="t.id">{{ t.name }} ({{ t.type }} {{ t.year }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <div class="actions">
                  <button mat-raised-button color="primary" (click)="exportInitialPdf()">
                    <mat-icon>picture_as_pdf</mat-icon> PDF para el grupo
                  </button>
                  <button mat-raised-button (click)="exportInitialExcel()">
                    <mat-icon>table_chart</mat-icon> Excel
                  </button>
                </div>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Jugadores</th>
                      @for (header of scheduleHeaders; track header) {
                        <th>{{ header }}</th>
                      }
                      <th>Seguro</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of schedule; track row.player) {
                      <tr>
                        <td>{{ row.player }}{{ exemptionSuffix(row.exemption) }}</td>
                        @for (amount of row.installments; track $index) {
                          <td>{{ row.exempt ? 'Liberado' : (amount | currency:'ARS':'symbol-narrow':'1.0-0') }}</td>
                        }
                        <td>{{ row.insurance | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
                        <td><strong>{{ row.total | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong></td>
                      </tr>
                    }
                    <tr class="totals">
                      <td>Total</td>
                      @for (sum of installmentTotals; track $index) {
                        <td>{{ sum | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
                      }
                      <td>{{ insuranceTotal | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
                      <td>{{ grandTotal | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>Reporte mensual: quién pagó y quién no</mat-card-title>
            <mat-card-subtitle>
              Mismo listado, actualizado mes a mes para el grupo de WhatsApp.
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (statusRows.length === 0) {
              <p class="empty">Necesitás jugadores y un torneo para armar este reporte.</p>
            } @else {
              <div class="toolbar">
                <p class="summary">
                  Al día: {{ playersUpToDate }} &nbsp;·&nbsp; Con deudas: {{ playersWithDebt }}
                </p>
                <div class="actions">
                  <button mat-raised-button color="primary" (click)="exportStatusPdf()">
                    <mat-icon>picture_as_pdf</mat-icon> PDF mensual
                  </button>
                  <button mat-raised-button (click)="exportStatusExcel()">
                    <mat-icon>table_chart</mat-icon> Excel
                  </button>
                </div>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Jugadores</th>
                      @for (header of scheduleHeaders; track header) {
                        <th>{{ header }}</th>
                      }
                      <th>Seguro</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of statusRows; track row.player) {
                      <tr>
                        <td>{{ row.player }}{{ exemptionSuffix(row.exemption) }}</td>
                        @for (status of row.installments; track $index) {
                          <td
                            [class.paid]="status === 'Pagó'"
                            [class.unpaid]="status === 'No pagó'"
                            [class.exempt]="status === 'Liberado'">{{ status }}</td>
                        }
                        <td [class.paid]="row.insurance === 'Pagó'" [class.unpaid]="row.insurance === 'No pagó'">
                          {{ row.insurance }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="section">
          <mat-card-header>
            <mat-card-title>Morosos / cuotas pendientes ({{ pending.length }})</mat-card-title>
            <mat-card-subtitle>Quién todavía no pagó cada cuota</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="actions pending-actions">
              <button mat-raised-button (click)="exportPendingPdf()" [disabled]="pending.length === 0">
                <mat-icon>picture_as_pdf</mat-icon> PDF morosos
              </button>
              <button mat-raised-button (click)="exportPendingExcel()" [disabled]="pending.length === 0">
                <mat-icon>table_chart</mat-icon> Excel
              </button>
            </div>
            @if (pending.length === 0) {
              <p class="empty">No hay pagos pendientes. ¡Todos al día!</p>
            } @else {
              <table mat-table [dataSource]="pending" class="mat-table">
                <ng-container matColumnDef="player">
                  <th mat-header-cell *matHeaderCellDef>Jugador</th>
                  <td mat-cell *matCellDef="let r">{{ r.player }}</td>
                </ng-container>
                <ng-container matColumnDef="tournament">
                  <th mat-header-cell *matHeaderCellDef>Torneo</th>
                  <td mat-cell *matCellDef="let r">{{ r.tournament }}</td>
                </ng-container>
                <ng-container matColumnDef="installment">
                  <th mat-header-cell *matHeaderCellDef>Cuota</th>
                  <td mat-cell *matCellDef="let r">{{ r.installment }}</td>
                </ng-container>
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>Monto</th>
                  <td mat-cell *matCellDef="let r">{{ r.amount | currency:'ARS':'symbol-narrow':'1.0-0' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="pendingColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: pendingColumns"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; }
    .header { margin-bottom: 16px; }
    .section { margin-bottom: 24px; }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin: 16px 0;
    }
    .actions, .pending-actions { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
    .actions button, .pending-actions button { display: flex; align-items: center; gap: 8px; }
    .loading, .empty { padding: 24px; text-align: center; color: #666; }
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 10px;
      text-align: left;
      white-space: pre-line;
    }
    th { background: #f5f5f5; font-weight: 600; }
    .totals td { font-weight: 600; background: #fafafa; }
    .paid { background: #e8f5e9; color: #2e7d32; font-weight: 600; text-align: center; }
    .unpaid { background: #ffebee; color: #c62828; font-weight: 600; text-align: center; }
    .exempt { background: #fff8e1; color: #f57f17; font-weight: 600; text-align: center; }
    .summary { margin: 0; color: #555; }
    .mat-table { width: 100%; }
  `]
})
export class ReportsComponent implements OnInit {
  private playerService = inject(PlayerService);
  private tournamentService = inject(TournamentService);
  private insuranceService = inject(InsuranceService);
  private teamService = inject(TeamService);
  private snackBar = inject(MatSnackBar);

  loading = true;
  team?: Team;
  tournaments: Tournament[] = [];
  selectedTournamentId = '';
  schedule: InitialScheduleRow[] = [];
  scheduleHeaders: string[] = [];
  pending: PendingPaymentRow[] = [];
  pendingColumns = ['player', 'tournament', 'installment', 'amount'];
  statusRows: PaymentStatusRow[] = [];
  private players: Player[] = [];
  private insurances: Insurance[] = [];
  private payments: TournamentPayment[] = [];

  get selectedTournament(): Tournament | undefined {
    return this.tournaments.find(t => t.id === this.selectedTournamentId);
  }

  get installmentTotals(): number[] {
    const tournament = this.selectedTournament;
    if (!tournament) return [];
    return Array.from({ length: tournament.installments }, (_, i) =>
      this.schedule.reduce((sum, row) => sum + (row.installments[i] ?? 0), 0)
    );
  }

  get insuranceTotal(): number {
    return this.schedule.reduce((sum, row) => sum + row.insurance, 0);
  }

  get grandTotal(): number {
    return this.schedule.reduce((sum, row) => sum + row.total, 0);
  }

  get playersUpToDate(): number {
    return this.statusRows.filter(r => !r.exempt && r.pendingCount === 0).length;
  }

  get playersWithDebt(): number {
    return this.statusRows.filter(r => !r.exempt && r.pendingCount > 0).length;
  }

  exemptionSuffix(exemption: InitialScheduleRow['exemption'] | PaymentStatusRow['exemption']): string {
    const label = exemptionLabel(exemption);
    return label ? ` (${label})` : '';
  }

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    combineLatest({
      players: this.playerService.getActivePlayers(),
      tournaments: this.tournamentService.getTournaments(),
      payments: this.tournamentService.getAllPayments(),
      insurances: this.insuranceService.getInsurances(),
      team: this.teamService.getTeam()
    }).pipe(take(1)).subscribe({
      next: ({ players, tournaments, payments, insurances, team }) => {
        this.players = players;
        this.insurances = insurances;
        this.payments = payments;
        this.team = team;
        this.tournaments = tournaments.filter(t => t.active);
        if (this.tournaments.length === 0) {
          this.tournaments = tournaments;
        }
        this.selectedTournamentId = this.tournaments[0]?.id ?? '';
        this.pending = buildPendingPaymentRows(players, this.tournaments, payments);
        this.rebuildSchedule();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Error al generar reporte', 'Cerrar', { duration: 4000 });
      }
    });
  }

  rebuildSchedule(): void {
    const tournament = this.selectedTournament;
    if (!tournament) {
      this.schedule = [];
      this.scheduleHeaders = [];
      this.statusRows = [];
      return;
    }
    this.scheduleHeaders = initialScheduleHeaders(tournament);
    this.schedule = buildInitialSchedule(this.players, tournament, this.insurances);
    this.statusRows = buildPaymentStatus(this.players, tournament, this.payments, this.insurances);
  }

  exportInitialPdf(): void {
    const tournament = this.selectedTournament;
    if (!tournament || this.schedule.length === 0) return;

    const teamName = this.team?.name ?? 'FAES';
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`${teamName} — Plan de pagos`, 14, 16);
    doc.setFontSize(11);
    doc.text(`${tournament.name} (${tournament.type} ${tournament.year})`, 14, 24);
    doc.setFontSize(9);
    doc.text('Enviar este PDF al grupo de WhatsApp de los jugadores', 14, 30);

    const head = ['Jugadores', ...this.scheduleHeaders.map(h => h.replace('\n', ' — ')), 'Seguro', 'Total'];
    const body = this.schedule.map(row => [
      row.exempt ? `${row.player} (Liberado)` : `${row.player}${this.exemptionSuffix(row.exemption)}`,
      ...row.installments.map(amount => row.exempt ? 'Liberado' : formatMoney(amount)),
      formatMoney(row.insurance),
      formatMoney(row.total)
    ]);
    body.push([
      'Total',
      ...this.installmentTotals.map(formatMoney),
      formatMoney(this.insuranceTotal),
      formatMoney(this.grandTotal)
    ]);

    autoTable(doc, {
      startY: 36,
      head: [head],
      body,
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [63, 81, 181], halign: 'center' },
      columnStyles: { 0: { halign: 'left' } }
    });

    doc.save(`plan-pagos-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  exportInitialExcel(): void {
    const tournament = this.selectedTournament;
    if (!tournament) return;
    const headers = ['Jugadores', ...this.scheduleHeaders.map(h => h.replace('\n', ' ')), 'Seguro', 'Total'];
    const data = this.schedule.map(row => {
      const record: Record<string, string | number> = {
        Jugadores: row.exempt ? `${row.player} (Liberado)` : `${row.player}${this.exemptionSuffix(row.exemption)}`
      };
      row.installments.forEach((amount, i) => {
        record[headers[i + 1]] = row.exempt ? 'Liberado' : amount;
      });
      record['Seguro'] = row.insurance;
      record['Total'] = row.total;
      return record;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan de pagos');
    XLSX.writeFile(wb, `plan-pagos-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  }

  exportStatusPdf(): void {
    const tournament = this.selectedTournament;
    if (!tournament || this.statusRows.length === 0) return;

    const teamName = this.team?.name ?? 'FAES';
    const today = new Date().toLocaleDateString('es-AR');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.text(`${teamName} — Estado de pagos`, 14, 16);
    doc.setFontSize(11);
    doc.text(`${tournament.name} (${tournament.type} ${tournament.year}) — ${today}`, 14, 24);
    doc.setFontSize(9);
    doc.text(`Al día: ${this.playersUpToDate}   ·   Con deudas: ${this.playersWithDebt}`, 14, 30);

    const head = ['Jugadores', ...this.scheduleHeaders.map(h => h.replace('\n', ' — ')), 'Seguro'];
    const body = this.statusRows.map(row => [
      `${row.player}${this.exemptionSuffix(row.exemption)}`,
      ...row.installments,
      row.insurance
    ]);

    autoTable(doc, {
      startY: 36,
      head: [head],
      body,
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [0, 150, 136], halign: 'center' },
      columnStyles: { 0: { halign: 'left' } },
      didParseCell: (data) => {
        if (data.section !== 'body' || data.column.index === 0) return;
        const value = String(data.cell.raw ?? '');
        if (value === 'Pagó') {
          data.cell.styles.fillColor = [232, 245, 233];
          data.cell.styles.textColor = [46, 125, 50];
        }
        if (value === 'Liberado') {
          data.cell.styles.fillColor = [255, 248, 225];
          data.cell.styles.textColor = [245, 127, 23];
        }
      }
    });

    doc.save(`estado-pagos-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  exportStatusExcel(): void {
    const tournament = this.selectedTournament;
    if (!tournament) return;
    const headers = ['Jugadores', ...this.scheduleHeaders.map(h => h.replace('\n', ' ')), 'Seguro'];
    const data = this.statusRows.map(row => {
      const record: Record<string, string> = { Jugadores: `${row.player}${this.exemptionSuffix(row.exemption)}` };
      row.installments.forEach((status, i) => {
        record[headers[i + 1]] = status;
      });
      record['Seguro'] = row.insurance;
      return record;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estado de pagos');
    XLSX.writeFile(wb, `estado-pagos-${tournament.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
  }

  exportPendingPdf(): void {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${this.team?.name ?? 'FAES'} — Cuotas pendientes`, 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [['Jugador', 'Torneo', 'Cuota', 'Monto']],
      body: this.pending.map(r => [r.player, r.tournament, String(r.installment), formatMoney(r.amount)])
    });
    doc.save('faes-pagos-pendientes.pdf');
  }

  exportPendingExcel(): void {
    const data = this.pending.map(r => ({
      Jugador: r.player,
      Torneo: r.tournament,
      Cuota: r.installment,
      Monto: r.amount
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pendientes');
    XLSX.writeFile(wb, 'faes-pagos-pendientes.xlsx');
  }
}
