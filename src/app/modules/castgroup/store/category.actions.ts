import { Action } from '@ngrx/store';
import { CategoryEntry} from '../category/category-entry';

export const CATEGORIES_LOAD = '[CastGroup] Load Categories';
export const CATEGORIES_LOADING = '[CastGroup] Loading Categories';

export class CategoriesLoad implements Action {
  readonly type = CATEGORIES_LOAD;
}

export class CategoriesLoading implements Action {
  readonly type = CATEGORIES_LOADING;

  constructor(public payload: CategoryEntry[]) {}
}

export type CastgroupCategoriesActions = CategoriesLoad | CategoriesLoading;
