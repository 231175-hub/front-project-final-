import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { registersemester, Registersemester$Params } from '../../../api/functions';
import { Api } from '../../../api/api';

@Component({
  selector: 'app-semester-insert',
  imports: [ ButtonModule, InputTextModule ],
  standalone: true,
  templateUrl: './semester-insert.html',
  styleUrl: './semester-insert.css',
})
export class SemesterInsert {
	semesterQuantity: number = 0;
	semesterRowList: any[] = [];
	listSemester: any[] = [];

  constructor(private api: Api) {}

  addUnit(): void {

		this.semesterQuantity = this.semesterRowList.length + 1;

		this.semesterRowList.push({
			'id': 'Semestre ' + this.semesterQuantity
		});
	}

  removeUnit(element: any): void {
		let positionTemp = this.semesterRowList.indexOf(element);
		if (positionTemp !== -1) {
			this.semesterRowList.splice(positionTemp, 1);		
		}

		let indexTemp = this.listSemester.findIndex((value) => value.name === element.id);
		if (indexTemp !== -1) {
			this.listSemester.splice(indexTemp, 1);
		}

		this.semesterRowList.forEach((item, index) => {
			const newValue = 'Semestre ' + (index + 1);

			let listSemesterItem = this.listSemester.find(val => val.name === item.id);
			if (listSemesterItem) {
				listSemesterItem.name = newValue;
			}

			item.id = newValue;
		})

		this.semesterQuantity = this.semesterRowList.length;
	}

  	sendInsertSemester(event: Event) {
		const numbers = this.semesterRowList.map((item, index) => index + 1);

		const bodyParams: Registersemester$Params = {
			body: {
				numberSemester: numbers
			}
		}

		this.api.invoke(registersemester,bodyParams).then((response: any) => {
			let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
    	})
  	}
}
