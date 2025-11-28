import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Item } from '../../services/item.service';
import * as ItemsActions from '../../items/state/items.actions';
import * as ItemsSelectors from '../../items/state/items.selectors';

@Component({
  selector: 'app-item-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './item-details.html',
  styleUrls: ['./item-details.css']
})
export class ItemDetailsComponent implements OnInit, OnDestroy {
  item$!: Observable<Item | null>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    console.log('[ItemDetails] constructor() - NgRx version');
    
    this.item$ = this.store.select(ItemsSelectors.selectSelectedItem);
    this.loading$ = this.store.select(ItemsSelectors.selectDetailsLoading);
    this.error$ = this.store.select(ItemsSelectors.selectDetailsError);
  }

  ngOnInit() {
    console.log('[ItemDetails] ngOnInit()');
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      
      if (id) {
        console.log('[ItemDetails] Loading item with id:', id);
        // Dispatch action to load item
        this.store.dispatch(ItemsActions.loadItem({ id }));
      } else {
        console.error('[ItemDetails] No ID in route params');
        this.store.dispatch(ItemsActions.loadItemFailure({ 
          error: 'Invalid character ID' 
        }));
      }
    });
  }

  ngOnDestroy() {
    console.log('[ItemDetails] ngOnDestroy() - clearing selected item');
    this.store.dispatch(ItemsActions.clearSelectedItem());
  }

  goBack() {
    this.location.back();
  }

  goToList() {
    this.router.navigateByUrl('/items');
  }

  getEpisodeCount(item: Item | null): number {
    return item?.episode?.length || 0;
  }
}