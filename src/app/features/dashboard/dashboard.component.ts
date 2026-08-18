import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <img src="logo-faes.png" alt="FAES FC" class="brand-logo" />
          <h2>FAES</h2>
        </div>
        
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard/home" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          
          <a mat-list-item routerLink="/dashboard/players" routerLinkActive="active">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Jugadores</span>
          </a>
          
          <a mat-list-item routerLink="/dashboard/tournaments" routerLinkActive="active">
            <mat-icon matListItemIcon>emoji_events</mat-icon>
            <span matListItemTitle>Torneos</span>
          </a>
          
          <a mat-list-item routerLink="/dashboard/payments" routerLinkActive="active">
            <mat-icon matListItemIcon>payment</mat-icon>
            <span matListItemTitle>Pagos</span>
          </a>

          <a mat-list-item routerLink="/dashboard/insurance" routerLinkActive="active">
            <mat-icon matListItemIcon>health_and_safety</mat-icon>
            <span matListItemTitle>Seguros</span>
          </a>
          
          <a mat-list-item routerLink="/dashboard/reports" routerLinkActive="active">
            <mat-icon matListItemIcon>assessment</mat-icon>
            <span matListItemTitle>Reportes</span>
          </a>
          
          <mat-divider></mat-divider>
          
          <a mat-list-item routerLink="/dashboard/settings" routerLinkActive="active">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Configuración</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <button mat-icon-button (click)="drawer.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          
          <span class="toolbar-spacer"></span>
          
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item disabled>
              <mat-icon>person</mat-icon>
              <span>{{ userEmail() }}</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar Sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 250px;
    }

    .sidenav-header {
      padding: 16px 20px;
      background: #111;
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
      
      .brand-logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: 50%;
        background: #fff;
      }

      h2 {
        margin: 0;
        font-size: 1.5rem;
      }
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .content {
      padding: 24px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    mat-nav-list a.active {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  userEmail = signal('');

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.email) {
      this.userEmail.set(user.email);
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
