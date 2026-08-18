import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from '@angular/fire/auth';
import { Firestore, Timestamp, doc, setDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  currentUser = signal<FirebaseUser | null>(null);

  user$ = new Observable<FirebaseUser | null>(subscriber => {
    try {
      return onAuthStateChanged(
        this.auth,
        user => {
          this.currentUser.set(user);
          subscriber.next(user);
        },
        error => subscriber.error(error)
      );
    } catch (error) {
      subscriber.error(error);
      return () => undefined;
    }
  });

  login(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (credential) => {
        await this.ensureAdminProfile(credential.user);
        return credential;
      })
    );
  }

  register(email: string, password: string, displayName: string): Observable<any> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap(async (credential) => {
        const firebaseUser = credential.user;
        await updateProfile(firebaseUser, { displayName });
        await this.ensureAdminProfile(firebaseUser, displayName);
        return credential;
      })
    );
  }

  private async ensureAdminProfile(firebaseUser: FirebaseUser, displayName?: string): Promise<void> {
    const now = Timestamp.now();
    await setDoc(
      doc(this.firestore, `users/${firebaseUser.uid}`),
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: displayName || firebaseUser.displayName || 'Admin',
        role: 'admin',
        createdAt: now,
        updatedAt: now
      },
      { merge: true }
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser() ?? this.auth.currentUser;
  }

  getUid(): string {
    const uid = this.getCurrentUser()?.uid;
    if (!uid) throw new Error('User not authenticated');
    return uid;
  }
}
