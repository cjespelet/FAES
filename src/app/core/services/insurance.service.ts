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
import { Insurance } from '../models/insurance.model';
import { AuthService } from './auth.service';
import { toDate } from '../utils/date.utils';
import { listenCollection } from '../utils/firestore.utils';

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getCollectionPath(): string {
    return `users/${this.authService.getUid()}/insurance`;
  }

  getInsurances(): Observable<Insurance[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    return listenCollection<Insurance>(query(collectionRef, orderBy('startDate', 'desc'))).pipe(
      map(items => [...items].sort(
        (a, b) => toDate(b.startDate).getTime() - toDate(a.startDate).getTime()
      ))
    );
  }

  getInsurance(id: string): Observable<Insurance> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`) as any;
    return docData(docRef, { idField: 'id' }) as Observable<Insurance>;
  }

  getInsurancesByPlayer(playerId: string): Observable<Insurance[]> {
    return this.getInsurances().pipe(
      map(items => items.filter(insurance => insurance.playerId === playerId))
    );
  }

  getPendingInsurances(): Observable<Insurance[]> {
    return this.getInsurances().pipe(
      map(items => items.filter(insurance => !insurance.paid))
    );
  }

  addInsurance(insurance: Omit<Insurance, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const newInsurance = {
      ...insurance,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    return from(addDoc(collectionRef, newInsurance)).pipe(
      map(docRef => docRef.id)
    );
  }

  updateInsurance(id: string, insurance: Partial<Insurance>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(updateDoc(docRef, {
      ...insurance,
      updatedAt: Timestamp.now()
    }));
  }

  deleteInsurance(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(deleteDoc(docRef));
  }

  markAsPaid(id: string, paymentDate: Date, paymentMethod: string): Observable<void> {
    return this.updateInsurance(id, {
      paid: true,
      paymentDate,
      paymentMethod: paymentMethod as any
    });
  }
}
