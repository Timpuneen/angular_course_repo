import { createAction, props } from '@ngrx/store';
import { Item, ApiResponse } from '../../services/item.service';

export const loadItems = createAction(
  '[Items List] Load Items',
  props<{ query?: string; page?: number }>()
);

export const loadItemsSuccess = createAction(
  '[Items API] Load Items Success',
  props<{ response: ApiResponse }>()
);

export const loadItemsFailure = createAction(
  '[Items API] Load Items Failure',
  props<{ error: string }>()
);

export const loadItem = createAction(
  '[Item Details] Load Item',
  props<{ id: string | number }>()
);

export const loadItemSuccess = createAction(
  '[Items API] Load Item Success',
  props<{ item: Item }>()
);

export const loadItemFailure = createAction(
  '[Items API] Load Item Failure',
  props<{ error: string }>()
);

export const clearSelectedItem = createAction(
  '[Item Details] Clear Selected Item'
);