import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ItemsState } from './items.reducer';

export const selectItemsState = createFeatureSelector<ItemsState>('items');

export const selectItems = createSelector(
  selectItemsState,
  (state: ItemsState) => state.items
);

export const selectListLoading = createSelector(
  selectItemsState,
  (state: ItemsState) => state.listLoading
);

export const selectListError = createSelector(
  selectItemsState,
  (state: ItemsState) => state.listError
);

export const selectSelectedItem = createSelector(
  selectItemsState,
  (state: ItemsState) => state.selectedItem
);

export const selectDetailsLoading = createSelector(
  selectItemsState,
  (state: ItemsState) => state.detailsLoading
);

export const selectDetailsError = createSelector(
  selectItemsState,
  (state: ItemsState) => state.detailsError
);

// Pagination selectors
export const selectTotalPages = createSelector(
  selectItemsState,
  (state: ItemsState) => state.totalPages
);

export const selectCurrentPage = createSelector(
  selectItemsState,
  (state: ItemsState) => state.currentPage
);

export const selectTotalCount = createSelector(
  selectItemsState,
  (state: ItemsState) => state.totalCount
);

export const selectItemsWithLoading = createSelector(
  selectItems,
  selectListLoading,
  selectListError,
  (items, loading, error) => ({ items, loading, error })
);

export const selectItemDetailsWithLoading = createSelector(
  selectSelectedItem,
  selectDetailsLoading,
  selectDetailsError,
  (item, loading, error) => ({ item, loading, error })
);