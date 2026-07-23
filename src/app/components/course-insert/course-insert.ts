import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ɵInternalFormsSharedModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Api } from '../../api/api';
import { indexschool, registercourse, Registercourse$Params } from '../../api/functions';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { inject } from '@angular/core';

interface Category {
    category: string;
}

@Component({
  selector: 'app-course-insert',
  imports: [ButtonModule, InputTextModule, ɵInternalFormsSharedModule, ReactiveFormsModule, SelectModule, ToastModule],
  providers: [MessageService],
  standalone: true,
  templateUrl: './course-insert.html',
  styleUrl: './course-insert.css',
})
export class CourseInsert implements OnInit {

	private messageService = inject(MessageService);

	get codefb() {return this.frmInsertCourse.controls['code']};
	get creditsfb() {return this.frmInsertCourse.controls['credits']};
	get nameCoursefb() {return this.frmInsertCourse.controls['nameCourse']};
	get idSchoolfb() {return this.frmInsertCourse.controls['idSchool']};
	get categoryfb() {return this.frmInsertCourse.controls['category']};

	unitQuantity: number = 0;
	unitRowList: any[] = [];
	listUnid: any[] = [];
	unitsTouched: boolean = false;

	listSchool: [] = [];


	categories: Category[] = [];

	frmInsertCourse: FormGroup;

	constructor(private formBuilder: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
		this.frmInsertCourse = this.formBuilder.group({
			'code': ['', [Validators.required]],
			'credits': ['', [Validators.required, Validators.pattern('^[0-9]$')]],
			'nameCourse': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$')]],
			'category': ['', [Validators.required]],
			'idSchool': ['', Validators.required]
		});
	}

	blockNonLetters(event: KeyboardEvent): void {
		if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]$/.test(event.key)) {
			event.preventDefault();
		}
	}

	blockNonDigits(event: KeyboardEvent): void {
		if (!/^[0-9]$/.test(event.key)) {
			event.preventDefault();
		}
	}

	ngOnInit(): void {
		this.api.invoke(indexschool).then((responseSchool: any) => {
			let apiResponseTempSchool = typeof responseSchool === 'string' ? JSON.parse(responseSchool) : responseSchool;
			let apiResponseSchool = apiResponseTempSchool.data ? apiResponseTempSchool.data : apiResponseTempSchool;
			this.listSchool = apiResponseSchool;
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
		this.unitsTouched = true;
		if (this.frmInsertCourse.invalid || this.unitRowList.length === 0) {
			this.frmInsertCourse.markAllAsTouched();
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Complete todos los campos obligatorios y agregue al menos una unidad.',
				life: 3000
			});
			return;
		}

		const numbers = this.unitRowList.map((item, index) => index + 1);

		const bodyParams: Registercourse$Params = {
			body: {
				code: this.codefb.value,
				credits: Number(this.creditsfb.value),
				nameCourse: this.nameCoursefb.value,
				category: this.categoryfb.value,
				idSchool: this.idSchoolfb.value,
				units: numbers as any
			}
		}

		this.api.invoke(registercourse, bodyParams).then((response: any) => {
			let apiResponse = typeof response === "string" ? JSON.parse(response) : response;
			this.messageService.add({
				severity: 'success',
				summary: 'Éxito',
				detail: 'Curso registrado correctamente.',
				life: 3000
			});
			this.frmInsertCourse.reset();
			this.unitRowList = [];
			this.unitQuantity = 0;
			this.unitsTouched = false;
			this.cdr.detectChanges();
		}).catch((err) => {
			console.error("Error al registrar el curso:", err);
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Ups. Algo salió mal al registrar el curso.',
				life: 3000
			});
		});
	}
}
