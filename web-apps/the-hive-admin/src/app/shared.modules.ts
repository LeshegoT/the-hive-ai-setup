import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { MaterialModule } from './material.module';
import { StaffFilterComponent } from './components/staff-filter/staff-filter.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UnitFilterComponent } from './components/unit-filter/unit-filter.component';
import { FileDropComponent } from './components/file-drop/file-drop.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { LongDateConversionDirective } from './directives/dateFormat.directive';


/**
 * Import shared modules only when the module will be shared with other modules.
 */

@NgModule({
  declarations: [
    HeaderComponent,
    FileDropComponent,
    LongDateConversionDirective,
  ],
  exports:[
    HeaderComponent,
    MaterialModule,
    StaffFilterComponent,
    UnitFilterComponent,
    FileDropComponent,
    ReactiveFormsModule,
    LongDateConversionDirective,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    UnitFilterComponent,
    StaffFilterComponent
  ],
  providers: [
    {
      provide: MAT_DATE_LOCALE, useValue: navigator.language
    }
  ]
})
export class SharedModule { }
