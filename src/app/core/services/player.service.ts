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
import { Player } from '../models/player.model';
import { AuthService } from './auth.service';
import { omitUndefined } from '../utils/date.utils';
import { listenCollection } from '../utils/firestore.utils';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getCollectionPath(): string {
    return `users/${this.authService.getUid()}/players`;
  }

  getPlayers(): Observable<Player[]> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    return listenCollection<Player>(query(collectionRef, orderBy('name', 'asc'))).pipe(
      map(items => [...items].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es')))
    );
  }

  getPlayer(id: string): Observable<Player> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`) as any;
    return docData(docRef, { idField: 'id' }) as Observable<Player>;
  }

  getActivePlayers(): Observable<Player[]> {
    return this.getPlayers().pipe(
      map(items => items.filter(player => player.active !== false))
    );
  }

  addPlayer(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const collectionRef = collection(this.firestore, this.getCollectionPath());
    const newPlayer = omitUndefined({
      ...player,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return from(addDoc(collectionRef, newPlayer)).pipe(
      map(docRef => docRef.id)
    );
  }

  updatePlayer(id: string, player: Partial<Player>): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(updateDoc(docRef, omitUndefined({
      ...player,
      updatedAt: Timestamp.now()
    })));
  }

  deletePlayer(id: string): Observable<void> {
    const docRef = doc(this.firestore, `${this.getCollectionPath()}/${id}`);
    return from(deleteDoc(docRef));
  }

  togglePlayerStatus(id: string, active: boolean): Observable<void> {
    return this.updatePlayer(id, { active });
  }
}
