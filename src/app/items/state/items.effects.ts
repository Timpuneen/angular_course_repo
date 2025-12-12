import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { ItemsService } from '../../services/item.service';
import * as ItemsActions from './items.actions';

@Injectable()
export class ItemsEffects {
  private actions$ = inject(Actions);
  private itemsService = inject(ItemsService);
  
  loadItems$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ItemsActions.loadItems),
      tap(action => console.log('[ItemsEffects] loadItems action triggered:', action)),
      switchMap(({ query, page }) => {
        console.log('[ItemsEffects] loadItems$ → query:', query, 'page:', page);
        
        return this.itemsService.getItems(query, page).pipe(
          tap(res => console.log('[ItemsEffects] API response received:', res)),
          map((response) => {
            console.log('[ItemsEffects] loadItems$ → SUCCESS:', response);
            return ItemsActions.loadItemsSuccess({ response });
          }),
          catchError((error) => {
            console.error('[ItemsEffects] loadItems$ → ERROR:', error);
            
            const errorMessage = query
              ? `No characters found for "${query}". Try another search term!`
              : 'Failed to load characters. Please try again later.';
            
            return of(ItemsActions.loadItemsFailure({ error: errorMessage }));
          })
        );
      })
    );
  });

  loadItem$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ItemsActions.loadItem),
      tap(action => console.log('[ItemsEffects] loadItem action triggered:', action)),
      switchMap(({ id }) => {
        console.log('[ItemsEffects] loadItem$ → id:', id);
        
        return this.itemsService.getItemById(id).pipe(
          tap(item => console.log('[ItemsEffects] Item data received:', item)),
          map((item) => {
            console.log('[ItemsEffects] loadItem$ → SUCCESS:', item);
            return ItemsActions.loadItemSuccess({ item });
          }),
          catchError((error) => {
            console.error('[ItemsEffects] loadItem$ → ERROR:', error);
            
            let errorMessage = 'Failed to load character details. Please try again later.';
            
            if (error.status === 404) {
              errorMessage = `Character with ID ${id} not found.`;
            }
            
            return of(ItemsActions.loadItemFailure({ error: errorMessage }));
          })
        );
      })
    );
  });

  constructor() {
    console.log('[ItemsEffects] constructor()');
  }
}