import { Injectable } from '@angular/core';
import { Actions, ofType, Effect } from '@ngrx/effects';
import { switchMap, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SearchService, SearchConfigurationService } from '@alfresco/adf-core';
import { ResultSetPaging } from '@alfresco/js-api';

import { CategoryState } from './category.reducer';
import * as CastgroupCategory from './category.actions';
import { CategoryEntry} from '../category/category-entry';


@Injectable()
export class CategoryEffects {
  constructor(
    private actions$: Actions,
    private categoryStore: Store<CategoryState>,
    private searchService: SearchService,
    private searchConfSrv: SearchConfigurationService
  ) {}

  @Effect({ dispatch: false })
  loadAllCategories = this.actions$.pipe(
    ofType(CastgroupCategory.CATEGORIES_LOAD),
    switchMap(() => {
      const tmpQuery = this.searchConfSrv.generateQueryBody('', 1000, 0);
      // the double slash // also returns subtrees
      tmpQuery.query.query = 'PATH:"cm:generalclassifiable//*"';
      tmpQuery.filterQueries = [{ query: "TYPE:'cm:category'" }, { query: 'NOT cm:creator:System' }];
      tmpQuery.include = ['properties'];
      return this.searchService.searchByQueryBody(tmpQuery).pipe(
        map(
          (data: ResultSetPaging) => {
            const tmpArray = [];
            data.list.entries.forEach((el) => {
              tmpArray.push(<CategoryEntry>{
                id: el.entry.id,
                label: el.entry.name
              });
            });
            this.categoryStore.dispatch(new CastgroupCategory.CategoriesLoading(tmpArray));
          },
          function (error) {
            console.error(error);
          }
        )
      );
    })
  );
}
