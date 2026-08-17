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
import { Player } from '../models/player.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getCollectionPath(): string {
    const userId = this.authService.getCurrentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');
    return `users/${userId}/players`;
  }

  getPlayers(): Observable<Player[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(collectionRef, orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Player[]>;
  }

  getPlayer(id: string): Observable<Player> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`) as any;
    return docData(docRef, { idField: 'id' }) as Observable<Player>;
  }

  getActivePlayers(): Observable<Player[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const q = query(
      collectionRef,
      where('active', '==', true),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Player[]>;
  }

  addPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const newPlayer = {
      ...player,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    return from(addDoc(collectionRef, newPlayer)).pipe(
      map(docRef => docRef.id)
    );
  }

  updatePlayer(id: string, player: Partial<Player>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(updateDoc(docRef, {
      ...player,
      updatedAt: Timestamp.now()
    }));
  }

  deletePlayer(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(deleteDoc(docRef));
  }

  togglePlayerStatus(id: string, active: boolean): Observable<void> {
    return this.updatePlayer(id, { active });
  }
}
