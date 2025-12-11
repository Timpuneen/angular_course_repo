import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favorites';

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  getFavorites(): Observable<number[]> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.getFavoritesFromFirestore(user.uid);
        } else {
          return of(this.getFavoritesFromLocalStorage());
        }
      })
    );
  }

  addToFavorites(itemId: number): Observable<void> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.addToFirestore(user.uid, itemId);
        } else {
          this.addToLocalStorage(itemId);
          return of(void 0);
        }
      })
    );
  }

  removeFromFavorites(itemId: number): Observable<void> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.removeFromFirestore(user.uid, itemId);
        } else {
          this.removeFromLocalStorage(itemId);
          return of(void 0);
        }
      })
    );
  }

  isFavorite(itemId: number): Observable<boolean> {
    return this.getFavorites().pipe(
      map(favorites => favorites.includes(itemId))
    );
  }


  private getFavoritesFromLocalStorage(): number[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private addToLocalStorage(itemId: number): void {
    const favorites = this.getFavoritesFromLocalStorage();
    if (!favorites.includes(itemId)) {
      favorites.push(itemId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    }
  }

  private removeFromLocalStorage(itemId: number): void {
    const favorites = this.getFavoritesFromLocalStorage();
    const filtered = favorites.filter(id => id !== itemId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  private getFavoritesFromFirestore(uid: string): Observable<number[]> {
    const docRef = doc(this.firestore, `users/${uid}`);
    
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          return data?.['favorites'] || [];
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  private addToFirestore(uid: string, itemId: number): Observable<void> {
    return this.getFavoritesFromFirestore(uid).pipe(
      switchMap(favorites => {
        if (!favorites.includes(itemId)) {
          favorites.push(itemId);
        }
        const docRef = doc(this.firestore, `users/${uid}`);
        return from(setDoc(docRef, { favorites }, { merge: true }));
      })
    );
  }

  private removeFromFirestore(uid: string, itemId: number): Observable<void> {
    return this.getFavoritesFromFirestore(uid).pipe(
      switchMap(favorites => {
        const filtered = favorites.filter(id => id !== itemId);
        const docRef = doc(this.firestore, `users/${uid}`);
        return from(setDoc(docRef, { favorites: filtered }, { merge: true }));
      })
    );
  }

  syncLocalToFirestore(uid: string): Observable<void> {
    const localFavorites = this.getFavoritesFromLocalStorage();
    
    if (localFavorites.length === 0) {
      return of(void 0);
    }

    return this.getFavoritesFromFirestore(uid).pipe(
      switchMap(cloudFavorites => {
        const merged = Array.from(new Set([...cloudFavorites, ...localFavorites]));
        
        const docRef = doc(this.firestore, `users/${uid}`);
        return from(setDoc(docRef, { favorites: merged }, { merge: true })).pipe(
          map(() => {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('✅ Local favorites synced to Firestore');
          })
        );
      })
    );
  }
}