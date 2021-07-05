// Angular imports
import { Observable, Subject, of, zip } from 'rxjs';
import { Store } from '@ngrx/store';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { MatAccordion, MatExpansionPanel } from '@angular/material/expansion';

import { Component, Input, OnInit, OnDestroy, ViewEncapsulation, OnChanges, SimpleChanges } from '@angular/core';
import { MinimalNodeEntryEntity, Node, TagsApi } from '@alfresco/js-api';
import { NodePermissionService, isLocked } from '@alfresco/aca-shared';
import { AppStore, infoDrawerMetadataAspect } from '@alfresco/aca-shared/store';
import {
  LogService,
  AlfrescoApiService,
  NodesApiService,
  TranslationService,
  CardViewItem,
  UpdateNotification,
  CardViewUpdateService
} from '@alfresco/adf-core';
import { CardViewGroup } from '@alfresco/adf-content-services/lib/content-metadata/interfaces/card-view-group.interface';
import { ContentMetadataService } from '@alfresco/adf-content-services';
import { AppExtensionService } from '@alfresco/adf-extensions';

// CASTGroup imports
import { CategoryState } from '../store/category.reducer';
import { getCategoriesState } from '../store/selectors/cast.selectors';
import * as CastgroupCategoriesActions from '../store/category.actions';
import { CastCategoryService } from '../category/services/castcategory.service';

@Component({
  selector: 'aca-my-metadata-tab',
  templateUrl: './my-metadata-tab.component.html',
  styleUrls: ['./my-metadata-tab.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app-metadata-tab adf-content-metadata' }
})
export class MyMetadataTabComponent implements OnChanges, OnInit, OnDestroy {
  protected onDestroy$ = new Subject<boolean>();
  gino: MatAccordion;
  pino: MatExpansionPanel;

  @Input()
  node: MinimalNodeEntryEntity;
  /** Toggles whether the edit button should be shown */
  @Input()
  editable = true;

  /** Toggles whether to display empty values in the card view */
  @Input()
  displayEmpty = true;
  /** Toggles whether or not to enable copy to clipboard action. */
  @Input()
  copyToClipboardAction = true;

  /** Toggles whether or not to enable chips for multivalued properties. */
  @Input()
  useChipsForMultiValueProperty = true;
  multiValueSeparator: string;

  /** The multi parameter of the underlying material expansion panel, set to true to allow multi accordion to be expanded at the same time */
  @Input()
  multi = true;

  /** Toggles whether the metadata properties should be shown */
  @Input()
  displayDefaultProperties: boolean = true;

  /** Toggles between expanded (ie, full information) and collapsed
   * (ie, reduced information) in the display
   */
  @Input()
  expanded: boolean = false;

  /** (optional) shows the given aspect in the expanded  card */
  @Input()
  displayAspect: string = null;

  changedProperties = {};
  hasMetadataChanged = false;
  basicProperties$: Observable<CardViewItem[]>;
  groupedProperties$: Observable<CardViewGroup[]>;
  /** Name of the metadata preset, which defines aspects and their properties */
  @Input()
  preset: string;

  displayAspect$: Observable<string>;

  properties = null;
  headers = null;
  tags = null;
  tagsOptions = null;
  categories = null;
  categoriesOptions = null;
  tagsApi: TagsApi;

  constructor(
    private permission: NodePermissionService,
    private mycatservice: CastCategoryService,
    protected appExtensionService: AppExtensionService,
    private store: Store<AppStore>,
    private contentMetadataService: ContentMetadataService,
    private cardViewUpdateService: CardViewUpdateService,
    private nodesApiService: NodesApiService,
    private logService: LogService,
    private alfrescoApiService: AlfrescoApiService,
    private translationService: TranslationService,
    private castStore: Store<CategoryState>
  ) {
    this.displayAspect$ = this.store.select(infoDrawerMetadataAspect);
    this.tagsApi = new TagsApi(this.alfrescoApiService.getInstance());
  }

  get canUpdateNode(): boolean {
    if (this.node && !isLocked({ entry: this.node })) {
      return this.permission.check(this.node, ['update']);
    }

    return false;
  }

  public canExpandProperties(): boolean {
    return !this.expanded || this.displayAspect === 'Properties';
  }

  ngOnInit() {
    //Categories are stored in the State, so subscribe to changes
    this.castStore
      .select(getCategoriesState)
      .pipe(takeUntil(this.onDestroy$))
      .subscribe((state) => {
        if (state) {
          this.categories = state;
          this.categoriesOptions = [];
          state.forEach((el) => {
            this.categoriesOptions.push({ key: el.id, label: el.label });
          });
          this.loadProperties(this.node);
        } else {
          console.log(state);
        }
      });
    // if no category loaded, try again... we are assuming that some category do exists
    if (this.categories.length < 1) {
      this.castStore.dispatch(new CastgroupCategoriesActions.CategoriesLoad());
    }

    this.cardViewUpdateService.itemUpdated$
      .pipe(
        //debounceTime(500),
        takeUntil(this.onDestroy$)
      )
      .subscribe((changes) => {
        if (changes.target.key !== '') {
          this.hasMetadataChanged = true;
          return this.saveNode(changes).pipe(
            catchError((err) => {
              this.handleUpdateError(err);
              return of(null);
            })
          );
        }
        return of(null);
      });
  }

  private loadProperties(node: Node) {
    if (node) {
      this.basicProperties$ = this.getProperties(node);
      this.groupedProperties$ = this.contentMetadataService.getGroupedProperties(node, this.preset);
    }
  }

  private getProperties(node: Node) {
    const properties$ = this.contentMetadataService.getBasicProperties(node);
    const contentTypeProperty$ = this.contentMetadataService.getContentTypeProperty(node);
    return zip(properties$, contentTypeProperty$).pipe(
      map(([properties, contentTypeProperty]) => {
        const filteredProperties = contentTypeProperty.filter(
          (property) => properties.findIndex((baseProperty) => baseProperty.key === property.key) === -1
        );
        return [...properties, ...filteredProperties];
      })
    );
  }

  saveNode(changes: UpdateNotification) {
    if (changes.target.key.search('cm:categories') > -1) {
      //if we have to save Categories
      let values = [];
      changes.target.value.forEach((el) => {
        values.push(el);
      });
      this.mycatservice.setCategory(this.node.id, values);
    } else {
      return this.nodesApiService.updateNode(this.node.id, changes.changed);
    }
    return of(null);
  }

  saveChanges() {
    this.nodesApiService
      .updateNode(this.node.id, this.changedProperties)
      .pipe(
        catchError((err) => {
          this.handleUpdateError(err);
          return of(null);
        })
      )
      .subscribe((updatedNode) => {
        if (updatedNode) {
          this.revertChanges();
          Object.assign(this.node, updatedNode);
          this.alfrescoApiService.nodeUpdated.next(this.node);
        }
      });
  }

  ngOnDestroy() {
    this.onDestroy$.next(true);
    this.onDestroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.node && !changes.node.firstChange) {
      this.loadProperties(changes.node.currentValue);
    }
  }

  revertChanges() {
    this.changedProperties = {};
    this.hasMetadataChanged = false;
  }

  cancelChanges() {
    this.revertChanges();
    this.loadProperties(this.node);
  }

  protected handleUpdateError(error: Error) {
    this.logService.error(error);

    let statusCode = 0;

    try {
      statusCode = JSON.parse(error.message).error.statusCode;
    } catch {}

    let message = `METADATA.ERRORS.${statusCode}`;

    if (this.translationService.instant(message) === message) {
      message = 'METADATA.ERRORS.GENERIC';
    }

    this.contentMetadataService.error.next({
      statusCode,
      message
    });
  }

  keyDown(event: KeyboardEvent) {
    if (event.keyCode === 37 || event.keyCode === 39) {
      // ArrowLeft && ArrowRight
      event.stopPropagation();
    }
  }

  public canExpandTheCard(group: CardViewGroup): boolean {
    return group.title === this.displayAspect;
  }

  private isEmpty(value: any): boolean {
    return value === undefined || value === null || value === '';
  }

  showGroup(group: CardViewGroup): boolean {
    const properties = group.properties.filter((property) => {
      return !this.isEmpty(property.displayValue);
    });

    return properties.length > 0;
  }
}
