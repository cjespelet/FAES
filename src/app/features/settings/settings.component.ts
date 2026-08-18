import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TeamService } from '../../core/services/team.service';
import { AuthService } from '../../core/services/auth.service';
import { Team } from '../../core/models/team.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <h1>Configuración del Equipo</h1>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-card>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()" class="form">
              <mat-form-field appearance="outline">
                <mat-label>Nombre del equipo</mat-label>
                <input matInput formControlName="name" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Categoría</mat-label>
                <input matInput formControlName="category" placeholder="Ej: Senior, Juveniles" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Temporada actual</mat-label>
                <input matInput formControlName="currentSeason" placeholder="Ej: 2026" />
              </mat-form-field>

              <h3>Colores</h3>
              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Color primario</mat-label>
                  <input matInput type="color" formControlName="primaryColor" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Color secundario</mat-label>
                  <input matInput type="color" formControlName="secondaryColor" />
                </mat-form-field>
              </div>

              <h3>Administrador</h3>
              <mat-form-field appearance="outline">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="adminName" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Teléfono</mat-label>
                <input matInput formControlName="adminPhone" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="adminEmail" />
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
                {{ saving ? 'Guardando...' : 'Guardar configuración' }}
              </button>
            </form>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 600px; margin: 0 auto; }
    .form { display: flex; flex-direction: column; gap: 8px; padding-top: 16px; }
    .row { display: flex; gap: 16px; mat-form-field { flex: 1; } }
    h3 { margin: 16px 0 8px; font-size: 1rem; color: #555; }
    .loading { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class SettingsComponent implements OnInit {
  private teamService = inject(TeamService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = true;
  saving = false;
  existingTeam = false;

  form = this.fb.group({
    name: ['', Validators.required],
    category: [''],
    currentSeason: [new Date().getFullYear().toString(), Validators.required],
    primaryColor: ['#3f51b5'],
    secondaryColor: ['#ff4081'],
    adminName: ['', Validators.required],
    adminPhone: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.email) {
      this.form.patchValue({ adminEmail: user.email });
    }
    if (user?.displayName) {
      this.form.patchValue({ adminName: user.displayName });
    }

    this.teamService.getTeam().subscribe({
      next: (team) => {
        if (team) {
          this.existingTeam = true;
          this.form.patchValue({
            name: team.name,
            category: team.category ?? '',
            currentSeason: team.currentSeason,
            primaryColor: team.colors?.primary ?? '#3f51b5',
            secondaryColor: team.colors?.secondary ?? '#ff4081',
            adminName: team.admin?.name ?? '',
            adminPhone: team.admin?.phone ?? '',
            adminEmail: team.admin?.email ?? ''
          });
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> = {
      name: v.name!,
      category: v.category || undefined,
      currentSeason: v.currentSeason!,
      colors: { primary: v.primaryColor!, secondary: v.secondaryColor! },
      admin: { name: v.adminName!, phone: v.adminPhone!, email: v.adminEmail! }
    };

    const obs = this.existingTeam
      ? this.teamService.updateTeam(payload)
      : this.teamService.saveTeam(payload);

    obs.subscribe({
      next: () => {
        this.existingTeam = true;
        this.saving = false;
        this.snackBar.open('Configuración guardada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Error al guardar', 'Cerrar', { duration: 4000 });
      }
    });
  }
}
