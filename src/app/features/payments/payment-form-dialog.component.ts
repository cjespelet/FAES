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
import {
  installmentForPayers,
  installmentForPlayer,
  paidTowardInstallment,
  payingPlayers,
  payingUnits,
  paymentExemption,
  remainingAmount
} from '../../core/utils/payment.utils';

export interface PaymentFormData {
  payment?: TournamentPayment;
  players: Player[];
  tournaments: Tournament[];
  payments?: TournamentPayment[];
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
        @if (balanceHint) {
          <p class="balance" [class.settled]="balanceSettled">{{ balanceHint }}</p>
        }

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
    .balance { margin: -4px 0 8px; font-size: 13px; color: #555; }
    .balance.settled { color: #2e7d32; font-weight: 600; }
  `]
})
export class PaymentFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentFormDialogComponent>);
  data = inject<PaymentFormData>(MAT_DIALOG_DATA);

  isEdit = !!this.data.payment;
  installmentOptions: number[] = [1, 2, 3];
  balanceHint = '';
  balanceSettled = false;

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
    tournamentId: [this.data.payment?.tournamentId ?? this.data.tournaments[0]?.id ?? '', Validators.required],
    playerId: [this.data.payment?.playerId ?? payingPlayers(this.data.players)[0]?.id ?? '', Validators.required],
    installmentNumber: [this.data.payment?.installmentNumber ?? 1, Validators.required],
    amount: [this.data.payment?.amount ?? null as number | null, [Validators.required, Validators.min(0.01)]],
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
    this.form.get('installmentNumber')?.valueChanges.subscribe(() => this.syncAmount());
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
    this.updateBalanceHint();
    if (this.isEdit) return;
    const remaining = this.currentRemaining();
    if (remaining == null || remaining <= 0) return;
    this.form.patchValue({ amount: remaining }, { emitEvent: false });
  }

  private updateBalanceHint(): void {
    const due = this.currentDue();
    const remaining = this.currentRemaining();
    if (due == null || remaining == null) {
      this.balanceHint = '';
      this.balanceSettled = false;
      return;
    }
    const paid = Math.round((due - remaining) * 100) / 100;
    this.balanceSettled = remaining <= 0;
    this.balanceHint = this.balanceSettled
      ? `Esta cuota ya está saldada (${this.formatMoney(due)}).`
      : `Cuota ${this.formatMoney(due)} · Pagado ${this.formatMoney(paid)} · Resta ${this.formatMoney(remaining)}`;
  }

  private currentDue(): number | null {
    const tournament = this.data.tournaments.find(t => t.id === this.form.get('tournamentId')?.value);
    if (!tournament) return null;
    const player = this.data.players.find(p => p.id === this.form.get('playerId')?.value);
    return player
      ? installmentForPlayer(tournament, this.data.players, player)
      : installmentForPayers(tournament, payingUnits(this.data.players));
  }

  private currentRemaining(): number | null {
    const due = this.currentDue();
    const tournamentId = this.form.get('tournamentId')?.value;
    const playerId = this.form.get('playerId')?.value;
    const installmentNumber = Number(this.form.get('installmentNumber')?.value);
    if (due == null || !tournamentId || !playerId || !installmentNumber) return null;
    const paid = paidTowardInstallment(
      this.data.payments ?? [],
      playerId,
      tournamentId,
      installmentNumber,
      this.data.payment?.id
    );
    return remainingAmount(due, paid);
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(value);
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
