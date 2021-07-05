/** Angular imports */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

/** Angular Material imports */
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';

import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';

/** Alfresco imports */
import { ExtensionService } from '@alfresco/adf-extensions';
import { CardViewModule, TranslateLoaderService, TRANSLATION_PROVIDER } from '@alfresco/adf-core';
import { TagModule } from '@alfresco/adf-content-services';

/** Castgroup imports */
import { categoryReducer } from './store/category.reducer';
import { CategoryEffects } from './store/category.effects';
import { CategoryActionsComponent } from './category/category-actions.component';
import { CategoryNodeListComponent } from './category/category-node-list.component';
import { MyMetadataTabComponent } from './my-metadata-tab/my-metadata-tab.component'

@NgModule({
  declarations: [CategoryActionsComponent,CategoryNodeListComponent, MyMetadataTabComponent],
  imports: [
    CommonModule,
    StoreModule.forFeature('castgroupFeature',categoryReducer),
    EffectsModule.forFeature([CategoryEffects]),
    ReactiveFormsModule,
    FormsModule,
    TranslateModule.forChild({
      loader: { provide: TranslateLoader, useClass: TranslateLoaderService }
    }),
    MatFormFieldModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatExpansionModule,
    MatCardModule,
    MatInputModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    MatTableModule,
    MatOptionModule,
    MatSelectModule,
    MatDialogModule,
    TagModule,
    CardViewModule
  ],
  providers: [
    {
      provide: TRANSLATION_PROVIDER,
      multi: true,
      useValue: {
        name: 'cast',
        source: 'assets/castgroup'
      }
    }
  ],
  exports: [CategoryNodeListComponent],
  entryComponents: [MyMetadataTabComponent, CategoryNodeListComponent]

})

export class CastgroupModule {
  constructor(private extensions: ExtensionService) {

    /* Overriding Alfresco default component for metadata */
    this.extensions.setComponents({
      'app.components.tabs.metadata': MyMetadataTabComponent
    });

  }
}
