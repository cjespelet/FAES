import { Observable } from 'rxjs';
import { Query, onSnapshot } from '@angular/fire/firestore';

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
