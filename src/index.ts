import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ListFilterPipe } from './list-filter';
import { ClickOutsideDirective } from './clickOutside';
import { Item, TemplateRenderer } from './menu-item';
import { AngularMultiSelect } from './multiselect.component'

@NgModule({
    imports: [CommonModule, FormsModule],
    declarations: [AngularMultiSelect, ClickOutsideDirective, ListFilterPipe, Item, TemplateRenderer],
    exports: [AngularMultiSelect, ClickOutsideDirective, ListFilterPipe, Item, TemplateRenderer]
})
export class AngularMultiSelectModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AngularMultiSelectModule,
      providers: []
    };
  }
}
