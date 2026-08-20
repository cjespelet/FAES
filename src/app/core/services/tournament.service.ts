import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  docData,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tournament, TournamentPayment } from '../models/tournament.model';
import { AuthService } from './auth.service';
import { omitUndefined, toDate } from '../utils/date.utils';
import { listenCollection } from '../utils/firestore.utils';

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getCollectionPath(): string {
    return `users/${this.authService.getUid()}/tournaments`;
  }

  private getPaymentsPath(): string {
    return `users/${this.authService.getUid()}/tournament-payments`;
  }

  getTournaments(): Observable<Tournament[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    return listenCollection<Tournament>(query(collectionRef, orderBy('year', 'desc'))).pipe(
      map(items => [...items].sort((a, b) => {
        if ((b.year ?? 0) !== (a.year ?? 0)) return (b.year ?? 0) - (a.year ?? 0);
        return toDate(b.startDate).getTime() - toDate(a.startDate).getTime();
      }))
    );
  }

  getTournament(id: string): Observable<Tournament> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`) as any;
    return docData(docRef, { idField: 'id' }) as Observable<Tournament>;
  }

  getActiveTournaments(): Observable<Tournament[]> {
    return this.getTournaments().pipe(
      map(items => items.filter(t => t.active !== false))
    );
  }

  addTournament(tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const newTournament = omitUndefined({
      ...tournament,
      installmentAmount: tournament.totalAmount / tournament.installments,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return from(addDoc(collectionRef, newTournament)).pipe(
      map(docRef => docRef.id)
    );
  }

  updateTournament(id: string, tournament: Partial<Tournament>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(updateDoc(docRef, omitUndefined({
      ...tournament,
      updatedAt: Timestamp.now()
    })));
  }

  deleteTournament(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(deleteDoc(docRef));
  }

  getAllPayments(): Observable<TournamentPayment[]> {
    const collectionRef = collection(this.firestore, this.getPaymentsPath());
    return listenCollection<TournamentPayment>(query(collectionRef)).pipe(
      map(items => [...items].sort(
        (a, b) => toDate(b.paymentDate).getTime() - toDate(a.paymentDate).getTime()
      ))
    );
  }

  getPaymentsByTournament(tournamentId: string): Observable<TournamentPayment[]> {
    return this.getAllPayments().pipe(
      map(items => items.filter(p => p.tournamentId === tournamentId))
    );
  }

  getPaymentsByPlayer(playerId: string): Observable<TournamentPayment[]> {
    return this.getAllPayments().pipe(
      map(items => items.filter(p => p.playerId === playerId))
    );
  }

  addPayment(payment: Omit<TournamentPayment, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getPaymentsPath());
    const newPayment = omitUndefined({
      ...payment,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return from(addDoc(collectionRef, newPayment)).pipe(
      map(docRef => docRef.id)
    );
  }

  updatePayment(id: string, payment: Partial<TournamentPayment>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getPaymentsPath()}/${id}`);
    return from(updateDoc(docRef, omitUndefined({
      ...payment,
      updatedAt: Timestamp.now()
    })));
  }

  deletePayment(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getPaymentsPath()}/${id}`);
    return from(deleteDoc(docRef));
  }
}
