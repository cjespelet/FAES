import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tournament, TournamentPayment } from '../models/tournament.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getCollectionPath(): string {
    const userId = this.authService.getCurrentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');
    return `users/${userId}/tournaments`;
  }

  private getPaymentsPath(): string {
    const userId = this.authService.getCurrentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');
    return `users/${userId}/tournament-payments`;
  }

  getTournaments(): Observable<Tournament[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(collectionRef, orderBy('year', 'desc'), orderBy('startDate', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Tournament[]>;
  }

  getTournament(id: string): Observable<Tournament> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`) as any;
    return docData(docRef, { idField: 'id' }) as Observable<Tournament>;
  }

  getActiveTournaments(): Observable<Tournament[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(
      collectionRef,
      where('active', '==', true),
      orderBy('startDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Tournament[]>;
  }

  addTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const newTournament = {
      ...tournament,
      installmentAmount: tournament.totalAmount / tournament.installments,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    return from(addDoc(collectionRef, newTournament)).pipe(
      map(docRef => docRef.id)
    );
  }

  updateTournament(id: string, tournament: Partial<Tournament>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(updateDoc(docRef, {
      ...tournament,
      updatedAt: Timestamp.now()
    }));
  }

  deleteTournament(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(deleteDoc(docRef));
  }

  getPaymentsByTournament(tournamentId: string): Observable<TournamentPayment[]> {
    const collectionRef = collection(this.firestore, this.getPaymentsPath());
    const q = query(
      collectionRef,
      where('tournamentId', '==', tournamentId),
      orderBy('paymentDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TournamentPayment[]>;
  }

  getPaymentsByPlayer(playerId: string): Observable<TournamentPayment[]> {
    const collectionRef = collection(this.firestore, this.getPaymentsPath());
    const q = query(
      collectionRef,
      where('playerId', '==', playerId),
      orderBy('paymentDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TournamentPayment[]>;
  }

  addPayment(payment: Omit<TournamentPayment, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getPaymentsPath());
    const newPayment = {
      ...payment,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    return from(addDoc(collectionRef, newPayment)).pipe(
      map(docRef => docRef.id)
    );
  }

  updatePayment(id: string, payment: Partial<TournamentPayment>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getPaymentsPath()}/${id}`);
    return from(updateDoc(docRef, {
      ...payment,
      updatedAt: Timestamp.now()
    }));
  }

  deletePayment(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getPaymentsPath()}/${id}`);
    return from(deleteDoc(docRef));
  }
}
