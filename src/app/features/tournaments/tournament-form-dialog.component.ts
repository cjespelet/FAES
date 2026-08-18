import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Tournament } from '../../core/models/tournament.model';
import { getInstallmentDueDates, toDate, formatMoney } from '../../core/utils/date.utils';
import { PlayerService } from '../../core/services/player.service';
import { payingPlayers, tournamentShare } from '../../core/utils/payment.utils';
import { take } from 'rxjs/operators';

export interface TournamentFormData {
  tournament?: Tournament;
}

@Component({
  selector: 'app-tournament-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Torneo' : 'Nuevo Torneo' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Torneo Apertura 2026" />
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="type">
              <mat-option value="Apertura">Apertura</mat-option>
              <mat-option value="Clausura">Clausura</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Año</mat-label>
            <input matInput type="number" formControlName="year" />
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Monto total del torneo ($)</mat-label>
            <input matInput type="number" formControlName="totalAmount" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cuotas</mat-label>
            <input matInput type="number" formControlName="installments" min="1" max="12" />
          </mat-form-field>
        </div>

        @if (splitHint) {
          <p class="hint">{{ splitHint }}</p>
        }

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Inicio</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fin</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <p class="hint">Fechas de vencimiento de cada cuota</p>
        <div formArrayName="dueDates" class="due-dates">
          @for (control of dueDates.controls; track $index) {
            <mat-form-field appearance="outline">
              <mat-label>Vencimiento cuota {{ $index + 1 }}</mat-label>
              <input matInput [matDatepicker]="picker" [formControlName]="$index" />
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          }
        </div>

        <mat-slide-toggle formControlName="active">Torneo activo</mat-slide-toggle>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">
        {{ isEdit ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }
    .hint { margin: 8px 0 0; color: #666; font-size: 14px; }
    .due-dates { display: flex; flex-direction: column; gap: 4px; }
  `]
})
export class TournamentFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TournamentFormDialogComponent>);
  private playerService = inject(PlayerService);
  data = inject<TournamentFormData>(MAT_DIALOG_DATA, { optional: true }) ?? {};

  isEdit = !!this.data.tournament;
  currentYear = new Date().getFullYear();
  payingCount = 0;
  exemptCount = 0;

  form = this.fb.group({
    name: [this.data.tournament?.name ?? '', Validators.required],
    type: [this.data.tournament?.type ?? 'Apertura', Validators.required],
    year: [this.data.tournament?.year ?? this.currentYear, [Validators.required, Validators.min(2000)]],
    totalAmount: [this.data.tournament?.totalAmount ?? 0, [Validators.required, Validators.min(1)]],
    installments: [this.data.tournament?.installments ?? 3, [Validators.required, Validators.min(1)]],
    startDate: [
      this.data.tournament ? toDate(this.data.tournament.startDate) : new Date(),
      Validators.required
    ],
    endDate: [
      this.data.tournament ? toDate(this.data.tournament.endDate) : new Date(),
      Validators.required
    ],
    dueDates: this.fb.array<Date>([]),
    active: [this.data.tournament?.active ?? true]
  });

  get dueDates(): FormArray {
    return this.form.get('dueDates') as FormArray;
  }

  get splitHint(): string {
    const total = Number(this.form.get('totalAmount')?.value ?? 0);
    const installments = Number(this.form.get('installments')?.value ?? 1);
    if (total <= 0 || installments <= 0) return '';
    if (this.payingCount <= 0) {
      return 'Marcá jugadores activos que no estén liberados para calcular la cuota.';
    }
    const share = tournamentShare(total, this.payingCount);
    const cuota = share / installments;
    const exemptText = this.exemptCount > 0 ? ` (${this.exemptCount} liberado${this.exemptCount === 1 ? '' : 's'})` : '';
    return `Se divide entre ${this.payingCount} jugador${this.payingCount === 1 ? '' : 'es'}${exemptText}: ${formatMoney(share)} cada uno (${formatMoney(cuota)} por cuota).`;
  }

  constructor() {
    this.syncDueDates(false);
    this.form.get('installments')?.valueChanges.subscribe(() => this.syncDueDates(true));
    this.form.get('startDate')?.valueChanges.subscribe(() => this.syncDueDates(true));
    this.playerService.getActivePlayers().pipe(take(1)).subscribe(players => {
      const payers = payingPlayers(players);
      this.payingCount = payers.length;
      this.exemptCount = players.filter(p => p.paymentExempt).length;
    });
  }

  private syncDueDates(fromStart: boolean): void {
    const count = Number(this.form.get('installments')?.value ?? 3);
    const start = this.form.get('startDate')?.value ?? new Date();
    const stored = fromStart ? undefined : this.data.tournament?.installmentDueDates;
    const dates = getInstallmentDueDates(start, count, stored);

    while (this.dueDates.length) {
      this.dueDates.removeAt(0);
    }
    dates.forEach(date => this.dueDates.push(this.fb.control(date, Validators.required)));
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
