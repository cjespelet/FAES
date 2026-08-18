import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';

import { Player } from '../../core/models/player.model';
import { toDate } from '../../core/utils/date.utils';
import { paymentExemption } from '../../core/utils/payment.utils';

export interface PlayerFormData {
  player?: Player;
}

@Component({
  selector: 'app-player-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Jugador' : 'Nuevo Jugador' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline">
          <mat-label>DNI</mat-label>
          <input matInput formControlName="dni" />
          @if (form.get('dni')?.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nombre completo</mat-label>
          <input matInput formControlName="name" />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" />
          @if (form.get('phone')?.hasError('required')) {
            <mat-error>Requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email (opcional)</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fecha de ingreso</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="joinedDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notas (opcional)</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>

        <mat-slide-toggle formControlName="active">Jugador activo</mat-slide-toggle>
        <mat-form-field appearance="outline">
          <mat-label>Pago del torneo</mat-label>
          <mat-select formControlName="paymentExemption">
            <mat-option value="none">Paga el 100%</mat-option>
            <mat-option value="half">Liberado 50%</mat-option>
            <mat-option value="full">Liberado 100%</mat-option>
          </mat-select>
        </mat-form-field>
        @if (form.get('paymentExemption')?.value === 'full') {
          <p class="hint">No se le cobran cuotas. El monto del torneo se reparte entre el resto.</p>
        } @else if (form.get('paymentExemption')?.value === 'half') {
          <p class="hint">Paga la mitad de la cuota. El resto del equipo cubre la otra mitad.</p>
        }
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
    .form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 320px;
      padding-top: 8px;
    }
    .full-width { width: 100%; }
    .hint { margin: 0; color: #666; font-size: 13px; }
  `]
})
export class PlayerFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PlayerFormDialogComponent>);
  data = inject<PlayerFormData>(MAT_DIALOG_DATA);

  isEdit = !!this.data.player;

  form = this.fb.group({
    dni: [this.data.player?.dni ?? '', Validators.required],
    name: [this.data.player?.name ?? '', Validators.required],
    phone: [this.data.player?.phone ?? '', Validators.required],
    email: [this.data.player?.email ?? ''],
    joinedDate: [
      this.data.player ? toDate(this.data.player.joinedDate) : new Date(),
      Validators.required
    ],
    notes: [this.data.player?.notes ?? ''],
    active: [this.data.player?.active ?? true],
    paymentExemption: [this.data.player ? paymentExemption(this.data.player) : 'none']
  });

  save(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
