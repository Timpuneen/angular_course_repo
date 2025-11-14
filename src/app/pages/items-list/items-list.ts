import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ItemsService, Item } from '../../services/item.service';
import { ItemCardComponent } from '../../components/item-card/item-card';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCardComponent],
  templateUrl: './items-list.html',
  styleUrls: ['./items-list.css']
})
export class ItemsListComponent implements OnInit, OnDestroy {
  items: Item[] = [];
  loading = false;
  error = false;
  errorMessage = '';
  searchTerm = '';
  
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private routeSubscription?: Subscription;

  constructor(
    private itemsService: ItemsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log('[ItemsList] constructor()');
  }

  ngOnInit() {
    console.log('[ItemsList] ngOnInit()');

    // Handle URL query params ("q")
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      const query = params['q'] || '';

      console.log('[ItemsList] queryParams changed:', params);
      console.log('[ItemsList] Loading items with query:', query);

      this.searchTerm = query;
      this.loadItems(query);
    });

    // Debounce search input
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      console.log('[ItemsList] debounced search:', value);
      this.updateUrlAndSearch(value);
    });
  }

  loadItems(query: string = '') {
    console.log('[ItemsList] loadItems() →', query);

    this.loading = true;
    this.error = false;

    this.itemsService.getItems(query).subscribe({
      next: (response) => {
        console.log('[ItemsList] SUCCESS:', response);
        this.items = response.results;
        this.loading = false;
      },
      error: (err) => {
        console.error('[ItemsList] ERROR:', err);

        this.error = true;
        this.items = [];
        this.loading = false;

        this.errorMessage = query
          ? `No characters found for "${query}". Try another search term!`
          : 'Failed to load characters. Please try again later.';
      }
    });
  }

  onSearchChange(value: string) {
    console.log('[ItemsList] onSearchChange():', value);
    this.searchSubject.next(value);
  }

  updateUrlAndSearch(query: string) {
    console.log('[ItemsList] updateUrlAndSearch():', query);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null },
      queryParamsHandling: 'merge'
    }).then(() => {
      console.log('[ItemsList] URL updated');
    });
  }

  clearSearch() {
    console.log('[ItemsList] clearSearch()');
    this.searchTerm = '';
    this.updateUrlAndSearch('');
  }

  ngOnDestroy() {
    console.log('[ItemsList] ngOnDestroy()');

    this.searchSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
}
