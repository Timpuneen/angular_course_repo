import { createReducer, on } from '@ngrx/store';
import { Item } from '../../services/item.service';
import * as ItemsActions from './items.actions';

export interface ItemsState {
  items: Item[];
  listLoading: boolean;
  listError: string | null;
  
  selectedItem: Item | null;
  detailsLoading: boolean;
  detailsError: string | null;
  
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const initialState: ItemsState = {
  items: [],
  listLoading: false,
  listError: null,
  
  selectedItem: null,
  detailsLoading: false,
  detailsError: null,
  
  totalCount: 0,
  totalPages: 0,
  currentPage: 1
};

export const itemsReducer = createReducer(
  initialState,
  
  on(ItemsActions.loadItems, (state) => ({
    ...state,
    listLoading: true,
    listError: null
  })),
  
  on(ItemsActions.loadItemsSuccess, (state, { response }) => ({
    ...state,
    items: response.results,
    listLoading: false,
    listError: null,
    totalCount: response.info.count,
    totalPages: response.info.pages
  })),
  
  on(ItemsActions.loadItemsFailure, (state, { error }) => ({
    ...state,
    items: [],
    listLoading: false,
    listError: error
  })),
  
  on(ItemsActions.loadItem, (state) => ({
    ...state,
    detailsLoading: true,
    detailsError: null
  })),
  
  on(ItemsActions.loadItemSuccess, (state, { item }) => ({
    ...state,
    selectedItem: item,
    detailsLoading: false,
    detailsError: null
  })),
  
  on(ItemsActions.loadItemFailure, (state, { error }) => ({
    ...state,
    selectedItem: null,
    detailsLoading: false,
    detailsError: error
  })),
  
  on(ItemsActions.clearSelectedItem, (state) => ({
    ...state,
    selectedItem: null,
    detailsError: null
  }))
);