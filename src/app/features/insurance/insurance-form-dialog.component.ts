import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Insurance } from '../../core/models/insurance.model';
import { Player } from '../../core/models/player.model';
import { toDate } from '../../core/utils/date.utils';

export interface InsuranceFormData {
  insurance?: Insurance;
  players: Player[];
}

@Component({
  selector: 'app-insurance-form-dialog',
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
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Seguro' : 'Nuevo Seguro' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>Jugador</mat-label>
          <mat-select formControlName="playerId">
            @for (p of data.players; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Período</mat-label>
          <input matInput formControlName="period" placeholder="Ej: Temporada 2026" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Monto ($)</mat-label>
          <input matInput type="number" formControlName="amount" />
        </mat-form-field>

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

        <mat-slide-toggle formControlName="paid">Pagado</mat-slide-toggle>

        @if (form.get('paid')?.value) {
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
            <input matInput [matDatepicker]="payPicker" formControlName="paymentDate" />
            <mat-datepicker-toggle matIconSuffix [for]="payPicker"></mat-datepicker-toggle>
            <mat-datepicker #payPicker></mat-datepicker>
          </mat-form-field>
        }

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
export class InsuranceFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<InsuranceFormDialogComponent>);
  data = inject<InsuranceFormData>(MAT_DIALOG_DATA);

  isEdit = !!this.data.insurance;

  form = this.fb.group({
    playerId: [this.data.insurance?.playerId ?? '', Validators.required],
    period: [this.data.insurance?.period ?? new Date().getFullYear().toString(), Validators.required],
    amount: [this.data.insurance?.amount ?? 0, [Validators.required, Validators.min(1)]],
    startDate: [
      this.data.insurance ? toDate(this.data.insurance.startDate) : new Date(),
      Validators.required
    ],
    endDate: [
      this.data.insurance ? toDate(this.data.insurance.endDate) : new Date(new Date().getFullYear(), 11, 31),
      Validators.required
    ],
    paid: [this.data.insurance?.paid ?? false],
    paymentMethod: [this.data.insurance?.paymentMethod ?? 'Efectivo'],
    paymentDate: [this.data.insurance?.paymentDate ? toDate(this.data.insurance.paymentDate) : new Date()],
    notes: [this.data.insurance?.notes ?? '']
  });

  ngOnInit(): void {
    this.form.get('paid')?.valueChanges.subscribe((paid) => {
      if (!paid) {
        this.form.patchValue({ paymentMethod: 'Efectivo', paymentDate: new Date() });
      }
    });
  }

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
