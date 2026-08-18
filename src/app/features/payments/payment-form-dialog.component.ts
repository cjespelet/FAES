import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { TournamentPayment } from '../../core/models/tournament.model';
import { Player } from '../../core/models/player.model';
import { Tournament } from '../../core/models/tournament.model';
import { toDate } from '../../core/utils/date.utils';
import { installmentForPayers, installmentForPlayer, payingPlayers, payingUnits, paymentExemption } from '../../core/utils/payment.utils';

export interface PaymentFormData {
  payment?: TournamentPayment;
  players: Player[];
  tournaments: Tournament[];
}

@Component({
  selector: 'app-payment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Pago' : 'Registrar Pago' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Torneo</mat-label>
          <mat-select formControlName="tournamentId">
            @for (t of data.tournaments; track t.id) {
              <mat-option [value]="t.id">{{ t.name }} ({{ t.type }} {{ t.year }})</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Jugador</mat-label>
          <mat-select formControlName="playerId">
            @for (p of payablePlayers; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}{{ paymentExemption(p) === 'half' ? ' (50%)' : '' }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Cuota Nº</mat-label>
            <mat-select formControlName="installmentNumber">
              @for (n of installmentOptions; track n) {
                <mat-option [value]="n">Cuota {{ n }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Monto ($)</mat-label>
            <input matInput type="number" formControlName="amount" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Método de pago</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="Efectivo">Efectivo</mat-option>
            <mat-option value="Transferencia">Transferencia</mat-option>
            <mat-option value="Débito">Débito</mat-option>
            <mat-option value="Crédito">Crédito</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha de pago</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="paymentDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Notas (opcional)</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 8px; min-width: 400px; padding-top: 8px; }
    .row { display: flex; gap: 12px; mat-form-field { flex: 1; } }
  `]
})
export class PaymentFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentFormDialogComponent>);
  data = inject<PaymentFormData>(MAT_DIALOG_DATA);

  isEdit = !!this.data.payment;
  installmentOptions: number[] = [1, 2, 3];

  get payablePlayers(): Player[] {
    const payers = payingPlayers(this.data.players);
    const currentId = this.data.payment?.playerId;
    if (currentId && !payers.some(p => p.id === currentId)) {
      const current = this.data.players.find(p => p.id === currentId);
      return current ? [current, ...payers] : payers;
    }
    return payers;
  }

  paymentExemption = paymentExemption;

  form = this.fb.group({
    tournamentId: [this.data.payment?.tournamentId ?? '', Validators.required],
    playerId: [this.data.payment?.playerId ?? '', Validators.required],
    installmentNumber: [this.data.payment?.installmentNumber ?? 1, Validators.required],
    amount: [this.data.payment?.amount ?? 0, [Validators.required, Validators.min(1)]],
    paymentMethod: [this.data.payment?.paymentMethod ?? 'Efectivo', Validators.required],
    paymentDate: [
      this.data.payment ? toDate(this.data.payment.paymentDate) : new Date(),
      Validators.required
    ],
    notes: [this.data.payment?.notes ?? '']
  });

  ngOnInit(): void {
    this.form.get('tournamentId')?.valueChanges.subscribe((id) => {
      this.updateInstallments(id);
      this.syncAmount();
    });
    this.form.get('playerId')?.valueChanges.subscribe(() => this.syncAmount());
    this.updateInstallments(this.form.get('tournamentId')?.value);
    this.syncAmount();
  }

  private updateInstallments(tournamentId: string | null | undefined): void {
    const tournament = this.data.tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      this.installmentOptions = Array.from({ length: tournament.installments }, (_, i) => i + 1);
    }
  }

  private syncAmount(): void {
    if (this.isEdit) return;
    const tournament = this.data.tournaments.find(t => t.id === this.form.get('tournamentId')?.value);
    if (!tournament) return;
    const player = this.data.players.find(p => p.id === this.form.get('playerId')?.value);
    const amount = player
      ? installmentForPlayer(tournament, this.data.players, player)
      : installmentForPayers(tournament, payingUnits(this.data.players));
    this.form.patchValue({ amount });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
