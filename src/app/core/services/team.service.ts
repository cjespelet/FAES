import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  docData,
  setDoc,
  updateDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Team } from '../models/team.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getDocPath(): string {
    const userId = this.authService.getCurrentUser()?.uid;
    if (!userId) throw new Error('User not authenticated');
    return `users/${userId}/settings/team`;
  }

  getTeam(): Observable<Team | undefined> {
    const docRef = doc(this.firestore, this.getDocPath());
    return docData(docRef, { idField: 'id' }) as Observable<Team | undefined>;
  }

  saveTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Observable<void> {
    const docRef = doc(this.firestore, this.getDocPath());
    const teamData = {
      ...team,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    return from(setDoc(docRef, teamData));
  }

  updateTeam(team: Partial<Team>): Observable<void> {
    const docRef = doc(this.firestore, this.getDocPath());
    return from(updateDoc(docRef, {
      ...team,
      updatedAt: Timestamp.now()
    }));
  }
}
