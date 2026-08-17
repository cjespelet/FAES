import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  user,
  User as FirebaseUser,
  updateProfile
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  user$ = user(this.auth);
  currentUser = signal<FirebaseUser | null>(null);

  constructor() {
    this.user$.subscribe(user => this.currentUser.set(user));
  }

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  register(email: string, password: string, displayName: string): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      map(async (credential) => {
        if (credential.user) {
          await updateProfile(credential.user, { displayName });
        }
        return credential;
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser();
  }
}
