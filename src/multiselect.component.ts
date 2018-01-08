import { Component, OnInit, SimpleChanges, OnChanges, ContentChild, ViewChild, forwardRef, Input, Output, EventEmitter, ElementRef, AfterViewInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator, FormControl } from '@angular/forms';
import { ListItem, MyException } from './multiselect.model';
import { DropdownSettings } from './multiselect.interface';
import { Item, TemplateRenderer } from './menu-item';

export const DROPDOWN_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AngularMultiSelect),
    multi: true
};
export const DROPDOWN_CONTROL_VALIDATION: any = {
    provide: NG_VALIDATORS,
    useExisting: forwardRef(() => AngularMultiSelect),
    multi: true,
}
const noop = () => {
};

@Component({
    selector: 'angular-multiselect',
    templateUrl: './multiselect.component.html',
    host: { '[class]': 'defaultSettings.classes' },
    styleUrls: ['./multiselect.component.scss'],
    providers: [DROPDOWN_CONTROL_VALUE_ACCESSOR, DROPDOWN_CONTROL_VALIDATION]
})

export class AngularMultiSelect implements OnInit, ControlValueAccessor, OnChanges, Validator {

    @Input()
    data: Array<ListItem>;

    @Input()
    settings: DropdownSettings;

    @Input()
    description: string;

    @Input()
    value: string;

    @Input()
    disabled: boolean;

    @Output('onSelect')
    onSelect: EventEmitter<ListItem> = new EventEmitter<ListItem>();

    @Output('onDeSelect')
    onDeSelect: EventEmitter<ListItem> = new EventEmitter<ListItem>();

    @Output('onSelectAll')
    onSelectAll: EventEmitter<Array<ListItem>> = new EventEmitter<Array<ListItem>>();

    @Output('onDeSelectAll')
    onDeSelectAll: EventEmitter<Array<ListItem>> = new EventEmitter<Array<ListItem>>();

    @Output('onOpen')
    onOpen: EventEmitter<any> = new EventEmitter<any>();

    @Output('onClose')
    onClose: EventEmitter<any> = new EventEmitter<any>();

    @ContentChild(Item) itemTempl: Item;

    @ViewChild('searchInput') searchInput: ElementRef;

    public selectedItems: Array<ListItem>;
    public selectedItemArray: Array<string>;
    public isActive: boolean = false;
    public isSelectAll: boolean = false;
    public groupedData: Array<ListItem>;
    filter: ListItem = new ListItem();
    defaultSettings: DropdownSettings = {
        singleSelection: false,
        text: 'Select',
        enableCheckAll: true,
        selectAllText: 'Select All',
        unSelectAllText: 'UnSelect All',
        enableSearchFilter: false,
        maxHeight: 300,
        badgeShowLimit: 999999999999,
        classes: '',
        disabled: false,
        searchPlaceholderText: 'Search',
        showCheckbox: true,
        noDataLabel: 'No Data Available',
        searchAutofocus: true
    }
    public parseError: boolean;
    constructor() {

    }
    ngOnInit() {
        this.settings = Object.assign(this.defaultSettings, this.settings);
        this.settings.description = this.description;
        this.settings.value = this.value;
        //console.log(this.settings, this.description)
        if (this.settings.groupBy) {
            this.groupedData = this.transformData(this.data, this.settings.groupBy);
        }
    }
    ngOnChanges(changes: SimpleChanges) {
        this.settings.disabled = this.disabled;
        //console.log(this.disabled);
        if (changes.data && !changes.data.firstChange) {
            if (this.settings.groupBy) {
                this.groupedData = this.transformData(this.data, this.settings.groupBy);
                if (this.data.length == 0) {
                    this.selectedItems = [];
                }
            }
        }
    }
    ngDoCheck() {
        if (this.selectedItems) {
            if (this.selectedItems.length == 0 || this.data.length == 0 || this.selectedItems.length < this.data.length) {
                this.isSelectAll = false;
            }
        }
    }
    onItemClick(item: ListItem, index: number, evt: Event) {
        if (this.settings.disabled) {
            return false;
        }

        let found = this.isSelected(item);
        let limit = this.selectedItems.length < this.settings.limitSelection ? true : false;

        if (!found) {
            if (this.settings.limitSelection) {
                if (limit) {
                    this.addSelected(item);
                    this.onSelect.emit(item);
                }
            }
            else {
                this.addSelected(item);
                this.onSelect.emit(item);
            }

        }
        else {
            this.removeSelected(item);
            this.onDeSelect.emit(item);
        }
        if (this.isSelectAll || this.data.length > this.selectedItems.length) {
            this.isSelectAll = false;
        }
        if (this.data.length == this.selectedItems.length) {
            this.isSelectAll = true;
        }
    }
    public validate(c: FormControl): any {
        return null;
    }
    private onTouchedCallback: (_: any) => void = noop;
    private onChangeCallback: (_: any) => void = noop;

    writeValue(value: any) {
        if (value !== undefined && value !== null) {
            if (this.settings.singleSelection) {
                try {

                    if (value.length > 1) {
                        // this.selectedItems = [value[0]];
                        this.selectedItemArray = [value[0]];
                        throw new MyException(404, { "msg": "Single Selection Mode, Selected Items cannot have more than one item." });
                    }
                    else {
                        // this.selectedItems = value;
                        this.selectedItemArray = value;
                    }
                }
                catch (e) {
                    console.error(e.body.msg);
                }

            }
            else {
                if (this.settings.limitSelection) {
                    this.selectedItemArray = value.splice(0, this.settings.limitSelection);
                }
                else {
                    //console.log(value);
                    // this.selectedItems = value;
                    this.selectedItemArray = value;
                }
                this.data.forEach((item, index) => {
                    if(this.selectedItemArray.indexOf(item[this.settings.value]) >= 0){
                        this.selectedItems.push(item);
                        this.data[index]['checked'] = true;
                    } else
                    this.data[index]['checked'] = false; 
                });
                // for(let arrCounter = 0; arrCounter < this.data.length; arrCounter++){
                //     if(this.selectedItemArray.indexOf(this.data[arrCounter][this.settings.value]) >= 0){
                //         this.selectedItems.push(this.data[arrCounter]);
                //         this.data[arrCounter]['checked'] = true;
                //     } else
                //     this.data[arrCounter]['checked'] = true;                        
                // }
                if (this.selectedItems.length === this.data.length && this.data.length > 0) {
                    this.isSelectAll = true;
                }
            }
        } else {
            this.selectedItems = [];
            this.selectedItemArray = [];
        }
    }

    //From ControlValueAccessor interface
    registerOnChange(fn: any) {
        this.onChangeCallback = fn;
    }

    //From ControlValueAccessor interface
    registerOnTouched(fn: any) {
        this.onTouchedCallback = fn;
    }
    trackByFn(index: number, item: ListItem) {
        return index;
    }
    isSelected(clickedItem: ListItem) {
        let found = false;
        this.selectedItems && this.selectedItems.forEach(item => {
            if (clickedItem[this.settings.value] === item[this.settings.value]) {
                found = true;
            }
        });
        return found;
    }
    addSelected(item: ListItem) {
        if (this.settings.singleSelection) {
            this.selectedItems = [];
            this.selectedItemArray = [];
            this.selectedItemArray.push(item[this.settings.value]);
            this.selectedItems.push(item);
        }
        else {
            this.selectedItemArray.push(item[this.settings.value]);
            this.selectedItems.push(item);
            this.data.forEach((item, index) => {
                if(this.selectedItemArray.indexOf(item[this.settings.value]) >= 0)
                    this.data[index]['checked'] = true;
            });
        }
        this.onChangeCallback(this.selectedItemArray);
        this.onTouchedCallback(this.selectedItemArray);
    }
    removeSelected(clickedItem: ListItem) {
        this.selectedItems && this.selectedItems.forEach(item => {
            if(clickedItem[this.settings.value] === item[this.settings.value]){
                this.data.forEach((item, index) => {
                    if(item[this.settings.value] == clickedItem[this.settings.value]){
                        this.data[index]['checked'] = false;
                        //console.log("done")
                    }
                        // this.data[index]['checked'] = false;
                });
               this.selectedItemArray.splice(this.selectedItemArray.indexOf(item[this.settings.value]),1);
               this.selectedItems.splice(this.selectedItems.indexOf(item),1);
           }
        });
        this.onChangeCallback(this.selectedItemArray);
        this.onTouchedCallback(this.selectedItemArray);
    }
    toggleDropdown(evt: any) {
        if (this.settings.disabled) {
            return false;
        }
        this.isActive = !this.isActive;
        if (this.isActive) {
            if (this.settings.searchAutofocus && this.settings.enableSearchFilter) {
                setTimeout(() => {
                    this.searchInput.nativeElement.focus();
                }, 0);
            }
            this.onOpen.emit(true);
        }
        else {
            this.onClose.emit(false);
        }
        evt.preventDefault();
    }
    closeDropdown() {
        this.filter = new ListItem();
        this.isActive = false;
        this.onClose.emit(false);
    }
    toggleSelectAll() {
        if (!this.isSelectAll) {
            this.data.forEach((item, index) => {
                item['checked'] = true;
            });
            this.selectedItems = [];
            this.selectedItems = this.data.slice();
            this.selectedItemArray = [];
            this.data.forEach(item => {this.selectedItemArray.push(item[this.settings.value])});
            this.isSelectAll = true;
            this.onChangeCallback(this.selectedItemArray);
            this.onTouchedCallback(this.selectedItemArray);

            this.onSelectAll.emit(this.selectedItems);
        }
        else {
            this.data.forEach((item, index) => {
                item['checked'] = false;
            });
            this.selectedItems = [];
            this.selectedItemArray = [];
            this.isSelectAll = false;
            this.onChangeCallback(this.selectedItemArray);
            this.onTouchedCallback(this.selectedItemArray);

            this.onDeSelectAll.emit(this.selectedItems);
        }
    }
    transformData(arr: Array<ListItem>, field: any): Array<ListItem> {
        const groupedObj: any = arr.reduce((prev: any, cur: any) => {
            if (!prev[cur[field]]) {
                prev[cur[field]] = [cur];
            } else {
                prev[cur[field]].push(cur);
            }
            return prev;
        }, {});
        const tempArr: any = [];
        Object.keys(groupedObj).map(function (x) {
            tempArr.push({ key: x, value: groupedObj[x] });
        });
        return tempArr;
    }
}