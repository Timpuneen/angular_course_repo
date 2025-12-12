import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favorites';
  
  private favoritesSubject = new BehaviorSubject<number[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.initializeFavorites();
  }

  private initializeFavorites(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.getFavoritesFromFirestore(user.uid).subscribe(favorites => {
          this.favoritesSubject.next(favorites);
        });
      } else {
        const localFavorites = this.getFavoritesFromLocalStorage();
        this.favoritesSubject.next(localFavorites);
      }
    });
  }

  getFavorites(): Observable<number[]> {
    return this.favorites$;
  }

  addToFavorites(itemId: number): Observable<void> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        const currentFavorites = this.favoritesSubject.value;
        
        if (currentFavorites.includes(itemId)) {
          return of(void 0); 
        }

        const newFavorites = [...currentFavorites, itemId];

        if (user) {
          return this.saveFavoritesToFirestore(user.uid, newFavorites).pipe(
            tap(() => this.favoritesSubject.next(newFavorites))
          );
        } else {
          this.saveFavoritesToLocalStorage(newFavorites);
          this.favoritesSubject.next(newFavorites);
          return of(void 0);
        }
      })
    );
  }

  removeFromFavorites(itemId: number): Observable<void> {
    return this.authService.currentUser$.pipe(
      switchMap(user => {
        const currentFavorites = this.favoritesSubject.value;
        const newFavorites = currentFavorites.filter(id => id !== itemId);

        if (user) {
          return this.saveFavoritesToFirestore(user.uid, newFavorites).pipe(
            tap(() => this.favoritesSubject.next(newFavorites))
          );
        } else {
          this.saveFavoritesToLocalStorage(newFavorites);
          this.favoritesSubject.next(newFavorites);
          return of(void 0);
        }
      })
    );
  }

  isFavorite(itemId: number): Observable<boolean> {
    return this.favorites$.pipe(
      map(favorites => favorites.includes(itemId))
    );
  }

  getCurrentFavorites(): number[] {
    return this.favoritesSubject.value;
  }

  private getFavoritesFromLocalStorage(): number[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveFavoritesToLocalStorage(favorites: number[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
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

  private saveFavoritesToFirestore(uid: string, favorites: number[]): Observable<void> {
    const docRef = doc(this.firestore, `users/${uid}`);
    return from(setDoc(docRef, { favorites }, { merge: true }));
  }

  syncLocalToFirestore(uid: string): Observable<void> {
    const localFavorites = this.getFavoritesFromLocalStorage();
    
    if (localFavorites.length === 0) {
      return of(void 0);
    }

    return this.getFavoritesFromFirestore(uid).pipe(
      switchMap(cloudFavorites => {
        const merged = Array.from(new Set([...cloudFavorites, ...localFavorites]));
        
        return this.saveFavoritesToFirestore(uid, merged).pipe(
          tap(() => {
            localStorage.removeItem(this.STORAGE_KEY);
            this.favoritesSubject.next(merged);
            console.log('✅ Local favorites synced to Firestore');
          })
        );
      })
    );
  }
}