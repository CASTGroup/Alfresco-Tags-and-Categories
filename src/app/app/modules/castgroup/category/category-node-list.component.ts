import { Component, Input, OnChanges, ViewEncapsulation, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';

import { NodeChildAssociation } from '@alfresco/js-api';

import { CastCategoryService } from './services/castcategory.service';
import { CategoryState } from '../store/category.reducer';
import { getCategoriesState } from '../store/selectors/cast.selectors';
import { CategoryEntry } from './category-entry';
import * as CastgroupCategoriesActions from '../store/category.actions';

@Component({
  selector: 'cast-category-node-list',
  templateUrl: './category-node-list.component.html',
  styleUrls: ['./category-node-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CategoryNodeListComponent implements OnChanges, OnDestroy, OnInit {
  /** The node. */
  @Input()
  node: NodeChildAssociation;

  /** Show delete button */
  @Input()
  showDelete = true;

  /** All the possibile categories */
  private categoriesEntries: CategoryEntry[] = [];
  /** The categories of the node */
  nodeCategories: CategoryEntry[];

  private onDestroy$ = new Subject<boolean>();

  constructor(private mycatService: CastCategoryService, private castStore: Store<CategoryState>) {}

  ngOnInit() {
    this.mycatService.refresh.pipe(takeUntil(this.onDestroy$)).subscribe((resp: { nodeId: string; categories?: string[] | null; error?: string }) => {
      if (this.node.id === resp.nodeId) {
        if (resp.categories) {
          this.node.properties['cm:categories'] = resp.categories;
          this.refreshCategories();
        } else if (resp.error) {
          console.log(resp.error);
        }
      }
    });

    /** Load all the categories from store */
    this.castStore.pipe(select(getCategoriesState), take(1)).subscribe((values) => {
      this.categoriesEntries = [];
      values.forEach((el) => this.categoriesEntries.push({ id: el.id, label: el.label }));
    });

    /** Register for any update on categories*/
    this.castStore
      .select(getCategoriesState)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((values) => {
        this.categoriesEntries = [];
        values.forEach((el) => this.categoriesEntries.push({ id: el.id, label: el.label }));
        this.refreshCategories();
      });
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

  ngOnChanges() {
    this.refreshCategories();
  }

  refreshCategories() {
    if (this.node && this.node.properties && this.node.properties['cm:categories'] && this.categoriesEntries) {
      this.nodeCategories = [];
      this.node.properties['cm:categories'].forEach((element) => {
        let tmpObj = this.categoriesEntries.find((x) => x.id === element);
        if (tmpObj) {
          this.nodeCategories.push(tmpObj);
        }
      });
    } else if (this.node && this.node.properties && this.node.properties['cm:categories'] && !this.categoriesEntries) {
      this.castStore.dispatch(new CastgroupCategoriesActions.CategoriesLoad());
    }
  }

  removeCategory(id) {
    //remove the category
    let gino = this.nodeCategories
      .map((el) => el.id)
      .filter((el2) => {
        return el2 !== id;
      });
    //Save
    this.mycatService.setCategory(this.node.id, gino);
    this.node.properties['cm:categories'] = gino;
  }
}
