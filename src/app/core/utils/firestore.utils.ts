import { Observable } from 'rxjs';
import { DocumentReference, Query, onSnapshot } from '@angular/fire/firestore';

export function listenCollection<T>(q: Query): Observable<T[]> {
  return new Observable(subscriber => {
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        subscriber.next(
          snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T))
        );
      },
      error => subscriber.error(error)
    );
    return unsubscribe;
  });
}

export function listenDocument<T>(docRef: DocumentReference): Observable<T | undefined> {
  return new Observable(subscriber => {
    const unsubscribe = onSnapshot(
      docRef,
      snapshot => {
        if (!snapshot.exists()) {
          subscriber.next(undefined);
          return;
        }
        subscriber.next({ id: snapshot.id, ...snapshot.data() } as T);
      },
      error => subscriber.error(error)
    );
    return unsubscribe;
  });
}

