import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Api } from '../../api/api';
import { indexschool, indexsemester, registercourse, Registercourse$Params } from '../../api/functions';
import { SelectModule } from 'primeng/select';

interface Category {
    category: string;
}

@Component({
  selector: 'app-course-insert',
  imports: [ButtonModule, InputTextModule, ɵInternalFormsSharedModule, ReactiveFormsModule, SelectModule],
  standalone: true,
  templateUrl: './course-insert.html',
  styleUrl: './course-insert.css',
})
export class CourseInsert implements OnInit {

	get codefb() {return this.frmInsertCourse.controls['code']};
	get creditsfb() {return this.frmInsertCourse.controls['credits']};
	get nameCoursefb() {return this.frmInsertCourse.controls['nameCourse']};
	get conceptualWeightfb() {return this.frmInsertCourse.controls['conceptualWeight']};
	get practicalWeightfb() {return this.frmInsertCourse.controls['practicalWeight']};
	get attitudinalWeightfb() {return this.frmInsertCourse.controls['attitudinalWeight']};
	get idSchoolfb() {return this.frmInsertCourse.controls['idSchool']};
	get idSemesterfb() {return this.frmInsertCourse.controls['idSemester']};
	get categoryfb() {return this.frmInsertCourse.controls['category']};

	unitQuantity: number = 0;
	unitRowList: any[] = [];
	listUnid: any[] = [];

	listSchool: [] = [];
	listSemester: [] = [];

	categories: Category[] = [];

	frmInsertCourse: FormGroup;

	constructor(private formBuilder: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
		this.frmInsertCourse = this.formBuilder.group({
			'code': ['', [Validators.required]],
			'credits': ['', [Validators.required]],
			'nameCourse': ['', [Validators.required]],
			'category': ['', [Validators.required]],
			'conceptualWeight': ['', [Validators.required]],
			'practicalWeight': ['', [Validators.required]],
			'attitudinalWeight': ['', [Validators.required]],
			'idSchool': ['', Validators.required],
			'idSemester': ['', [Validators.required]]
		});
	}

	ngOnInit(): void {
		this.api.invoke(indexschool).then((responseSchool: any) => {
			let apiResponseTempSchool = typeof responseSchool === 'string' ? JSON.parse(responseSchool) : responseSchool;
			let apiResponseSchool = apiResponseTempSchool.data ? apiResponseTempSchool.data : apiResponseTempSchool;
			this.listSchool = apiResponseSchool;
			this.cdr.detectChanges();
		});

		this.api.invoke(indexsemester).then((responseSemester: any) => {
			let apiResponseTempSemester = typeof responseSemester === 'string' ? JSON.parse(responseSemester) : responseSemester;
			let apiResponseSemester = apiResponseTempSemester.data ? apiResponseTempSemester.data : apiResponseTempSemester;
			this.listSemester = apiResponseSemester;
			this.cdr.detectChanges();
		});

		this.categories = [ 
			{ category: 'AFPO'},
			{ category: 'AFPE' }
		];
	}

  	addUnit(): void {

		this.unitQuantity = this.unitRowList.length + 1;

		this.unitRowList.push({
			'id': 'Unidad ' + this.unitQuantity
		});
	}

  	removeUnit(element: any): void {
		let positionTemp = this.unitRowList.indexOf(element);
		if (positionTemp !== -1) {
			this.unitRowList.splice(positionTemp, 1);		
		}

		let indexTemp = this.listUnid.findIndex((value) => value.name === element.id);
		if (indexTemp !== -1) {
			this.listUnid.splice(indexTemp, 1);
		}

		this.unitRowList.forEach((item, index) => {
			const newValue = 'Unidad ' + (index + 1);

			let listUnidItem = this.listUnid.find(val => val.name === item.id);
			if (listUnidItem) {
				listUnidItem.name = newValue;
			}

			item.id = newValue;
		})

		this.unitQuantity = this.unitRowList.length;
	}

	sendInsertCourse(event: Event) {
		const numbers = this.unitRowList.map((item, index) => index + 1);

		const bodyParams: Registercourse$Params = {
			body: {
				code: this.codefb.value,
				credits: this.creditsfb.value,
				nameCourse: this.nameCoursefb.value,
				category: this.categoryfb.value,
				conceptualWeight: this.conceptualWeightfb.value,
				practicalWeight: this.practicalWeightfb.value,
				attitudinalWeight: this.attitudinalWeightfb.value,
				idSchool: this.idSchoolfb.value,
				idSemester: this.idSemesterfb.value,
				units: numbers
			}
		}

		this.api.invoke(registercourse, bodyParams).then((response: any) => {
			let apiResponse = typeof response === "string" ? JSON.parse(response) : response;
		});
	}
}
