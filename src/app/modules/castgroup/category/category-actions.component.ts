import { Component, Input, OnChanges, ViewEncapsulation, OnDestroy, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { MinimalNodeEntryEntity } from '@alfresco/js-api';

import { CastCategoryService } from './services/castcategory.service';
import { CategoryState } from '../store/category.reducer';
import { getCategoriesState } from '../store/selectors/cast.selectors';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { CategoryEntry } from './category-entry';

@Component({
  selector: 'cast-cat-node-actions-list',
  templateUrl: './category-actions.component.html',
  styleUrls: ['./category-actions.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CategoryActionsComponent implements OnChanges, OnInit, OnDestroy {
  /** The identifier of a node. */
  @Input()
  node: MinimalNodeEntryEntity;
  /** display the none option in the select */
  @Input()
  displayNoneOption: boolean = true;

  /** Emitted when a category is added successfully. */
  @Output()
  successAdd: EventEmitter<any> = new EventEmitter();

  /** Emitted when an error occurs. */
  @Output()
  error: EventEmitter<any> = new EventEmitter();

  /** Emitted when an action occurs. */
  @Output()
  result = new EventEmitter();

  /** all the possible categories presents in Alfresco */
  categoriesEntries: CategoryEntry[];
  /** the actual categories associated in this node */
  nodeCategories: CategoryEntry[];
  errorMsg: string;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  chipCtrl = new FormControl();
  //filteredChips: Observable<any[]>;
  filteredChips: CategoryEntry[];

  @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement>;
  @ViewChild('auto') matAutocomplete: MatAutocompleteTrigger;

  private onDestroy$ = new Subject<boolean>();

  constructor(private mycatService: CastCategoryService, private castStore: Store<CategoryState>) {
    /*     this.filteredChips = this.chipCtrl.valueChanges.pipe(
      startWith(null),
      map((chip: string | null) => (chip ? this._filter(chip) : this.categoriesEntries.slice()))
    ); */
  }
  private _filter(value: string): void {
    let filterValue = '';
    if (!!value) {
      filterValue = value.toLowerCase();
    }

    this.filteredChips = this.categoriesEntries
      .filter((el) => el.label.toLowerCase().indexOf(filterValue) > -1)
      .filter((el2) => !this.node.properties['cm:categories'].includes(el2.id));
  }

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
    this.castStore
      .select(getCategoriesState)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((categories) => {
        //console.log(state);
        this.categoriesEntries = [];
        categories.forEach((el) => this.categoriesEntries.push({ id: el.id, label: el.label }));
        this.refreshCategories();
      });
    this.chipCtrl.valueChanges.subscribe((value) => this._filter(value));
    this._filter(null);
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

  ngOnChanges() {
    return this.refreshCategories();
  }

  refreshCategories() {
    if (this.node.properties['cm:categories'] && this.categoriesEntries) {
      this.nodeCategories = [];
      this.node.properties['cm:categories'].forEach((element) => {
        let tmpObj = this.categoriesEntries.find((x) => x.id === element);
        if (tmpObj) {
          this.nodeCategories.push(tmpObj);
        }
      });
    }
  }

  cleanErrorMsg() {
    this.errorMsg = '';
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
    this.chipInput.nativeElement.value = '';
    this.matAutocomplete.closePanel();
  }

  showNoneOption() {
    return this.displayNoneOption;
  }

  selected(event: MatAutocompleteSelectedEvent) {
    if (!this.nodeCategories) {
      this.nodeCategories = [];
    }
    this.nodeCategories.push({ id: event.option.value, label: event.option.viewValue });
    let tmpValues = this.nodeCategories.map((el) => el.id);
    this.mycatService.setCategory(this.node.id, tmpValues);
    let gino = this.nodeCategories.map((el) => el.id);
    this.node.properties['cm:categories'] = gino;
    this.successAdd.emit(this.node);
    this.chipInput.nativeElement.value = '';
    this._filter(null);
  }
}
