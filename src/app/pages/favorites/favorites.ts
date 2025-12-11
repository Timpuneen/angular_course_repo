import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FavoritesService } from '../../services/favorites.service';
import { ItemsService, Item } from '../../services/item.service';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrls: ['./favorites.css']
})
export class FavoritesComponent implements OnInit {
  favoriteItems$!: Observable<Item[]>;
  isLoading = true;
  isLoggedIn = false;

  constructor(
    private favoritesService: FavoritesService,
    private itemsService: ItemsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.favoriteItems$ = this.authService.currentUser$.pipe(
      switchMap(user => {
        this.isLoggedIn = !!user;
        this.isLoading = true;

        return this.favoritesService.getFavorites().pipe(
          switchMap(favoriteIds => {
            if (favoriteIds.length === 0) {
              this.isLoading = false;
              return of([]);
            }

            const requests = favoriteIds.map(id => 
              this.itemsService.getItemById(id).pipe(
                catchError(() => of(null))
              )
            );

            return forkJoin(requests).pipe(
              map(items => {
                this.isLoading = false;
                return items.filter(item => item !== null) as Item[];
              })
            );
          }),
          catchError(() => {
            this.isLoading = false;
            return of([]);
          })
        );
      })
    );
  }

  removeFromFavorites(itemId: number): void {
    this.favoritesService.removeFromFavorites(itemId).subscribe({
      next: () => {
        console.log('Removed from favorites:', itemId);
        this.ngOnInit();
      },
      error: (err) => {
        console.error('Error removing from favorites:', err);
      }
    });
  }

  trackByItemId(index: number, item: Item): number {
    return item.id;
  }
}