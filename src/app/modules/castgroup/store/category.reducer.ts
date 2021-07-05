import * as CastgroupCategory from './category.actions';
import { CategoryEntry} from '../category/category-entry';

export interface CategoryState {
  categoriesLoaded: boolean;
  categories: CategoryEntry[];
}

export const initialCategoryState: CategoryState = {
  categoriesLoaded: false,
  categories: []
};

export function categoryReducer(state: CategoryState = initialCategoryState, action: CastgroupCategory.CastgroupCategoriesActions) {
  switch (action.type) {
    case CastgroupCategory.CATEGORIES_LOADING:
      return {
        ...state,
        categoriesLoaded: true,
        categories: action.payload
      };

    default:
      return state;
  }
}
