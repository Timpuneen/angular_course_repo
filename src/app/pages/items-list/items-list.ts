import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Item } from '../../services/item.service';
import { ItemCardComponent } from '../../components/item-card/item-card';
import * as ItemsActions from '../../items/state/items.actions';
import * as ItemsSelectors from '../../items/state/items.selectors';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ItemCardComponent],
  templateUrl: './items-list.html',
  styleUrls: ['./items-list.css']
})
export class ItemsListComponent implements OnInit, OnDestroy {
  // Observables from store
  items$!: Observable<Item[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  totalPages$!: Observable<number>;
  currentPage$!: Observable<number>;
  
  // Local state
  searchTerm = '';
  currentPage = 1;
  
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private routeSubscription?: Subscription;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log('[ItemsList] constructor() - NgRx version with pagination');
    
    // Initialize observables in constructor
    this.items$ = this.store.select(ItemsSelectors.selectItems);
    this.loading$ = this.store.select(ItemsSelectors.selectListLoading);
    this.error$ = this.store.select(ItemsSelectors.selectListError);
    this.totalPages$ = this.store.select(ItemsSelectors.selectTotalPages);
    this.currentPage$ = this.store.select(ItemsSelectors.selectCurrentPage);
  }

  ngOnInit() {
    console.log('[ItemsList] ngOnInit()');

    // Listen to query params changes
    this.routeSubscription = this.route.queryParams.pipe(
      switchMap(params => {
        const query = params['q'] || '';
        const page = parseInt(params['page']) || 1;
        
        console.log('[ItemsList] queryParams changed:', { query, page });
        
        this.searchTerm = query;
        this.currentPage = page;
        
        // Dispatch action to load items
        this.store.dispatch(ItemsActions.loadItems({ query, page }));
        
        return this.error$;
      }),
      catchError(error => {
        console.error('[ItemsList] Error in route subscription:', error);
        return [];
      })
    ).subscribe();

    // Setup search with debounce
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(value => {
        console.log('[ItemsList] debounced search with switchMap:', value);
        this.updateUrlAndSearch(value, 1); // Reset to page 1 on new search
        return [];
      }),
      catchError(error => {
        console.error('[ItemsList] Error in search:', error);
        return [];
      })
    ).subscribe();
  }

  onSearchChange(value: string) {
    console.log('[ItemsList] onSearchChange():', value);
    this.searchSubject.next(value);
  }

  updateUrlAndSearch(query: string, page: number) {
    console.log('[ItemsList] updateUrlAndSearch():', { query, page });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        q: query || null,
        page: page > 1 ? page : null 
      },
      queryParamsHandling: 'merge'
    }).then(() => {
      console.log('[ItemsList] URL updated');
    });
  }

  clearSearch() {
    console.log('[ItemsList] clearSearch()');
    this.searchTerm = '';
    this.updateUrlAndSearch('', 1);
  }

  // Pagination methods
  goToPage(page: number) {
    console.log('[ItemsList] goToPage():', page);
    this.updateUrlAndSearch(this.searchTerm, page);
  }

  nextPage() {
    console.log('[ItemsList] nextPage()');
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    console.log('[ItemsList] previousPage()');
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  ngOnDestroy() {
    console.log('[ItemsList] ngOnDestroy()');
    this.searchSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }
}