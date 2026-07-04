import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Api } from '../../../api/api';
import { indexcourse, indexschool, registercourseenrollment, Registercourseenrollment$Params, searchcourse, searchstudent } from '../../../api/functions';
import { SelectModule } from 'primeng/select';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { AutoCompleteModule } from 'primeng/autocomplete';

@Component({
  selector: 'app-course-enrollment-insert',
  imports: [ButtonModule, SelectModule, FormsModule, ReactiveFormsModule, AutoCompleteModule],
  standalone: true,
  templateUrl: './course-enrollment-insert.html',
  styleUrl: './course-enrollment-insert.css',
})
export class CourseEnrollmentInsert implements OnInit {
    
    get idSchoolfb() { return this.frmCourseEnrollmentInsert.controls['idSchool']; }
    get idStudentfb() { return this.frmCourseEnrollmentInsert.controls['idStudent']; }

    courseQuantity: number = 0;
    courseRowList: any[] = [];
    listUnid: any[] = [];
    listSchool: any[] = [];
    StudentSelected: any;
    studentSuggestion: any[] = [];
    listCourse: any[] = [];
    courseSuggestions: any[] = [];

    frmCourseEnrollmentInsert: FormGroup;

    constructor(private api: Api, private cdr: ChangeDetectorRef, private formBuilder: FormBuilder) {
        this.frmCourseEnrollmentInsert = this.formBuilder.group({
            'idSchool': ['', [Validators.required]],
            'idStudent': ['', [Validators.required]],
        });
    }

    ngOnInit(): void {
        this.api.invoke(indexschool).then((response: any) => {
            let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
            let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
            this.listSchool = apiResponse;
            this.cdr.markForCheck();
        });

        this.api.invoke(indexcourse).then((response: any) => {
            let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
            let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
            this.listCourse = apiResponse;
            this.cdr.markForCheck();
        });
    }

    addCourse(): void {
        this.courseQuantity = this.courseRowList.length + 1;
        this.courseRowList.push({
            'id': this.courseQuantity, 
            'idCourseSelected': null
        });
    }

    removeCourse(element: any): void {
        let positionTemp = this.courseRowList.indexOf(element);
        if (positionTemp !== -1) {
            this.courseRowList.splice(positionTemp, 1);     
        }

        let indexTemp = this.listUnid.findIndex((value) => value.name === element.id);
        if (indexTemp !== -1) {
            this.listUnid.splice(indexTemp, 1);
        }

        this.courseRowList.forEach((item, index) => {
            const newValue = 'Unidad ' + (index + 1);
            let listUnidItem = this.listUnid.find(val => val.name === item.id);
            if (listUnidItem) {
                listUnidItem.name = newValue;
            }
            item.id = newValue;
        });

        this.courseQuantity = this.courseRowList.length;
    }

    searchStudent(event: any): void {
        const term = event.query;
        const idEscuelaSeleccionada = this.frmCourseEnrollmentInsert.value.idSchool;

        if (!idEscuelaSeleccionada) {
            return;
        }

        const parameters = { 
            query: term, 
            idSchool: idEscuelaSeleccionada 
        };

        this.api.invoke(searchstudent, parameters).then((response: any) => {
            let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
            this.studentSuggestion = [...apiResponse];
            this.cdr.markForCheck();
        }).catch((error) => {
            console.error(error);
        });
    }

    getAvailableCourses(filaActual: any): any[] {
        const idsSeleccionadosEnOtrasFilas = this.courseRowList.filter(row => row.id !== filaActual.id && row.idCourseSelected != null).map(row => row.idCourseSelected);

        return this.listCourse.filter(curso => !idsSeleccionadosEnOtrasFilas.includes(curso.idCourse));
    }

    searchCourse(event: any): void {
        const term = event.query;
        const idSchoolValue = this.frmCourseEnrollmentInsert.value.idSchool;
    
        if (!idSchoolValue) return;
    
        this.api.invoke(searchcourse, { query: term, idSchool: idSchoolValue }).then((res: any) => {
          let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
          this.courseSuggestions = [...(apiResponse.data ? apiResponse.data : apiResponse)];
          this.cdr.markForCheck();
        });
      }

    sendInsertEnrollment(event: Event) {
        const idEstudianteFinal = this.idStudentfb.value ? this.idStudentfb.value.idStudent : null;

        const cursosSeleccionadosFinal = this.courseRowList.map(row => row.idCourseSelected).filter(id => id != null);

        if (!idEstudianteFinal || cursosSeleccionadosFinal.length === 0) {
            console.warn("Faltan datos. Seleccione un alumno y al menos un curso.");
            return;
        }

        const bodyParams: Registercourseenrollment$Params = {
            body: {
                idStudent: idEstudianteFinal,
                courses: cursosSeleccionadosFinal
            }
        };

        this.api.invoke(registercourseenrollment, bodyParams).then((response: any) => {
            let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
        });
    }
}