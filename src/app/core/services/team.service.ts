import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { Team } from '../models/team.model';
import { AuthService } from './auth.service';
import { listenDocument } from '../utils/firestore.utils';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private getDocPath(): string {
    return `users/${this.authService.getUid()}/settings/team`;
  }

  getTeam(): Observable<Team | undefined> {
    return listenDocument<Team>(doc(this.firestore, this.getDocPath()));
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
