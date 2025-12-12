import { Injectable } from '@angular/core';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, tap, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'favorites_guest';
  
  private favoritesSubject = new BehaviorSubject<number[]>([]);
  public favorites$ = this.favoritesSubject.asObservable();

  private currentUserId: string | null = null;

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.initializeFavorites();
  }

  private initializeFavorites(): void {
    this.authService.currentUser$.pipe(
      distinctUntilChanged((prev, curr) => prev?.uid === curr?.uid),
      switchMap(user => {
        console.log('[FavoritesService] User changed:', user?.uid);
        
        this.currentUserId = user?.uid || null;
        
        if (user) {
          console.log('[FavoritesService] User logged in - loading from Firestore');
          
          return this.getFavoritesFromFirestore(user.uid).pipe(
            tap(favorites => {
              console.log(`[FavoritesService] Loaded ${favorites.length} favorites from Firestore for user ${user.uid}`);
            })
          );
        } else {
          const localFavorites = this.getFavoritesFromLocalStorage();
          console.log(`[FavoritesService] User logged out - loaded ${localFavorites.length} favorites from localStorage`);
          return of(localFavorites);
        }
      }),
      catchError(error => {
        console.error('[FavoritesService] Error initializing favorites:', error);
        return of([]);
      })
    ).subscribe(favorites => {
      this.favoritesSubject.next(favorites);
    });
  }

  getFavorites(): Observable<number[]> {
    return this.favorites$;
  }

  addToFavorites(itemId: number): Observable<void> {
    const currentFavorites = this.favoritesSubject.value;
    
    if (currentFavorites.includes(itemId)) {
      console.log('[FavoritesService] Item already in favorites:', itemId);
      return of(void 0);
    }

    const newFavorites = [...currentFavorites, itemId];

    if (this.currentUserId) {
      console.log('[FavoritesService] Adding to Firestore for user:', this.currentUserId);
      return this.saveFavoritesToFirestore(this.currentUserId, newFavorites).pipe(
        tap(() => {
          this.favoritesSubject.next(newFavorites);
          console.log('[FavoritesService] Added to Firestore:', itemId);
        }),
        catchError(error => {
          console.error('[FavoritesService] Error adding to Firestore:', error);
          return of(void 0);
        })
      );
    } else {
      console.log('[FavoritesService] Adding to localStorage (guest):', itemId);
      this.saveFavoritesToLocalStorage(newFavorites);
      this.favoritesSubject.next(newFavorites);
      return of(void 0);
    }
  }

  removeFromFavorites(itemId: number): Observable<void> {
    const currentFavorites = this.favoritesSubject.value;
    const newFavorites = currentFavorites.filter(id => id !== itemId);

    if (this.currentUserId) {
      console.log('[FavoritesService] Removing from Firestore for user:', this.currentUserId);
      return this.saveFavoritesToFirestore(this.currentUserId, newFavorites).pipe(
        tap(() => {
          this.favoritesSubject.next(newFavorites);
          console.log('[FavoritesService] Removed from Firestore:', itemId);
        }),
        catchError(error => {
          console.error('[FavoritesService] Error removing from Firestore:', error);
          return of(void 0);
        })
      );
    } else {
      console.log('[FavoritesService] Removing from localStorage (guest):', itemId);
      this.saveFavoritesToLocalStorage(newFavorites);
      this.favoritesSubject.next(newFavorites);
      return of(void 0);
    }
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
    } catch (error) {
      console.error('[FavoritesService] Error reading from localStorage:', error);
      return [];
    }
  }

  private saveFavoritesToLocalStorage(favorites: number[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      console.log('[FavoritesService] Saved to localStorage:', favorites.length, 'items');
    } catch (error) {
      console.error('[FavoritesService] Error saving to localStorage:', error);
    }
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
      catchError(error => {
        console.error('[FavoritesService] Error reading from Firestore:', error);
        return of([]);
      })
    );
  }

  private saveFavoritesToFirestore(uid: string, favorites: number[]): Observable<void> {
    const docRef = doc(this.firestore, `users/${uid}`);
    console.log('[FavoritesService] Saving to Firestore:', uid, favorites.length, 'items');
    return from(setDoc(docRef, { favorites }, { merge: true }));
  }
}