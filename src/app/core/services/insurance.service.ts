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
import { Insurance } from '../models/insurance.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class InsuranceService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getCollectionPath(): string {
    const userId = this.authService.getCurrentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');
    return `users/${userId}/insurance`;
  }

  getInsurances(): Observable<Insurance[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(collectionRef, orderBy('startDate', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Insurance[]>;
  }

  getInsurance(id: string): Observable<Insurance> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return docData(docRef, { idField: 'id' }) as Observable<Insurance>;
  }

  getInsurancesByPlayer(playerId: string): Observable<Insurance[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(
      collectionRef,
      where('playerId', '==', playerId),
      orderBy('startDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Insurance[]>;
  }

  getPendingInsurances(): Observable<Insurance[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(
      collectionRef,
      where('paid', '==', false),
      orderBy('startDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Insurance[]>;
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
