import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CategoryState } from '../category.reducer';

export const getCastgroupFeature = createFeatureSelector<CategoryState>('castgroupFeature');
export const getCategoriesState = createSelector(getCastgroupFeature, (state: CategoryState) => state.categories);
