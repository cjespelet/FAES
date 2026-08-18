import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title class="title">
            <img src="logo-faes.png" alt="FAES FC" class="brand-logo" />
            <h1>FAES</h1>
            <p>Gestión de Equipo de Fútbol</p>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <mat-tab-group>
            <mat-tab label="Iniciar Sesión">
              <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="form-container">
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="tu@email.com">
                  @if (loginForm.get('email')?.hasError('required')) {
                    <mat-error>El email es requerido</mat-error>
                  }
                  @if (loginForm.get('email')?.hasError('email')) {
                    <mat-error>Email inválido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Contraseña</mat-label>
                  <input matInput type="password" formControlName="password" placeholder="••••••••">
                  @if (loginForm.get('password')?.hasError('required')) {
                    <mat-error>La contraseña es requerida</mat-error>
                  }
                </mat-form-field>

                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit" 
                  [disabled]="loginForm.invalid || loading()"
                  class="submit-button">
                  @if (loading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Ingresar
                  }
                </button>
              </form>
            </mat-tab>

            <mat-tab label="Registrarse">
              <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="form-container">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput type="text" formControlName="displayName" placeholder="Tu nombre">
                  @if (registerForm.get('displayName')?.hasError('required')) {
                    <mat-error>El nombre es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" placeholder="tu@email.com">
                  @if (registerForm.get('email')?.hasError('required')) {
                    <mat-error>El email es requerido</mat-error>
                  }
                  @if (registerForm.get('email')?.hasError('email')) {
                    <mat-error>Email inválido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Contraseña</mat-label>
                  <input matInput type="password" formControlName="password" placeholder="••••••••">
                  @if (registerForm.get('password')?.hasError('required')) {
                    <mat-error>La contraseña es requerida</mat-error>
                  }
                  @if (registerForm.get('password')?.hasError('minlength')) {
                    <mat-error>Mínimo 6 caracteres</mat-error>
                  }
                </mat-form-field>

                <button 
                  mat-raised-button 
                  color="accent" 
                  type="submit" 
                  [disabled]="registerForm.invalid || loading()"
                  class="submit-button">
                  @if (loading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Crear Cuenta
                  }
                </button>
              </form>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 450px;
    }

    .title {
      text-align: center;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;

      .brand-logo {
        width: 88px;
        height: 88px;
        object-fit: contain;
        border-radius: 50%;
        margin-bottom: 8px;
      }
      
      h1 {
        font-size: 2.5rem;
        margin: 0;
      }
      
      p {
        margin: 5px 0 0 0;
        color: #666;
        font-size: 1rem;
      }
    }

    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px 16px;
    }

    .submit-button {
      margin-top: 8px;
      height: 48px;
    }

    mat-spinner {
      margin: 0 auto;
    }
  `]
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);

  ngOnInit(): void {
    this.authService.user$.pipe(
      take(1),
      timeout(2500),
      catchError(() => of(null))
    ).subscribe(user => {
      if (user) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  registerForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onLogin(): void {
    if (this.loginForm.valid) {
      this.loading.set(true);
      const { email, password } = this.loginForm.value;
      
      this.authService.login(email, password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
          this.snackBar.open('¡Bienvenido!', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open('Error al iniciar sesión. Verifica tus credenciales.', 'Cerrar', { duration: 5000 });
          console.error('Login error:', error);
        }
      });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      const { email, password, displayName } = this.registerForm.value;
      
      this.authService.register(email, password, displayName).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
          this.snackBar.open('¡Cuenta creada exitosamente!', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open('Error al crear la cuenta. Intenta con otro email.', 'Cerrar', { duration: 5000 });
          console.error('Register error:', error);
        }
      });
    }
  }
}
