import { Component, computed, signal, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UnitService } from '../../services/unit.service';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-unit-filter',
    imports: [
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        AsyncPipe
    ],
    templateUrl: './unit-filter.component.html'
})
export class UnitFilterComponent implements OnInit {
	public selectedUnitList = signal<string[]>(undefined);
	staffUnits$: Observable<string[]>;
	filteredStaffUnits$: Observable<string[]>;

	ngOnInit() {
		this.staffUnits$ = this.unitService.getAllUnits().pipe(
			map((units) => units.map(unit=> unit.unitName))
		);
		this.filteredStaffUnits$ = combineLatest({ staffUnits: this.staffUnits$, unitSearchInputText: this.unitSearchInputText.valueChanges.pipe(startWith(this.unitSearchInputText.value)) })
		.pipe(
			map(({ staffUnits, unitSearchInputText }) => staffUnits.filter(unit => unit.toLocaleLowerCase().includes(unitSearchInputText.toLocaleLowerCase())))
		);
	}

	public unitSearchInputText = new FormControl<string>('');

	constructor(private unitService: UnitService) {}

	public onUnitSelected(event: MatAutocompleteSelectedEvent) {
		if(!this.selectedUnitList()?.includes(event.option.viewValue)) {
			this.selectedUnitList.update(units => units ? [...units, event.option.viewValue] : [event.option.viewValue]);
		} else {
			// Do nothing unit already selected.
		}
		this.unitSearchInputText.setValue('');
    	event.option.deselect();
	}

	remove(unitToRemove: string): void {
		this.selectedUnitList.update(units => {
			const selectedUnits = [...units.filter((unit)=>unit!== unitToRemove)];
			return selectedUnits.length > 0 ? selectedUnits : undefined;
		});
	}
}
