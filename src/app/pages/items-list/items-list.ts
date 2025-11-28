import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  
  // Local state
  searchTerm = '';
  
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private routeSubscription?: Subscription;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    console.log('[ItemsList] constructor() - NgRx version');
    
    // Initialize observables in constructor
    this.items$ = this.store.select(ItemsSelectors.selectItems);
    this.loading$ = this.store.select(ItemsSelectors.selectListLoading);
    this.error$ = this.store.select(ItemsSelectors.selectListError);
  }

  ngOnInit() {
    console.log('[ItemsList] ngOnInit()');

    this.routeSubscription = this.route.queryParams.subscribe(params => {
      const query = params['q'] || '';

      console.log('[ItemsList] queryParams changed:', params);
      console.log('[ItemsList] Dispatching loadItems with query:', query);

      this.searchTerm = query;
      
      this.store.dispatch(ItemsActions.loadItems({ query, page: 1 }));
    });

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      console.log('[ItemsList] debounced search:', value);
      this.updateUrlAndSearch(value);
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