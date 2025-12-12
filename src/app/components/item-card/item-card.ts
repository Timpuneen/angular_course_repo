import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Item } from '../../services/item.service';
import { FavoritesService } from '../../services/favorites.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './item-card.html',
  styleUrls: ['./item-card.css']
})
export class ItemCardComponent {
  @Input() item!: Item;
  
  isFavorite$!: Observable<boolean>;
  isProcessing = false;

  constructor(private favoritesService: FavoritesService) {}

  ngOnInit(): void {
    this.isFavorite$ = this.favoritesService.isFavorite(this.item.id);
  }

  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.isProcessing) return;

    this.isProcessing = true;

    const currentFavorites = this.favoritesService.getCurrentFavorites();
    const isFav = currentFavorites.includes(this.item.id);

    const action$ = isFav 
      ? this.favoritesService.removeFromFavorites(this.item.id)
      : this.favoritesService.addToFavorites(this.item.id);

    action$.subscribe({
      next: () => {
        this.isProcessing = false;
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Error toggling favorite:', err);
      }
    });
  }
}