import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Api } from '../../../api/api';
import { indexcourse, indexschool, registercourseenrollment, Registercourseenrollment$Params, searchcourse, searchstudent } from '../../../api/functions';
import { SelectModule } from 'primeng/select';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-course-enrollment-insert',
  imports: [ButtonModule, SelectModule, FormsModule, ReactiveFormsModule, AutoCompleteModule, ToastModule, ConfirmDialogModule, NgClass],
  providers: [MessageService, ConfirmationService],
  standalone: true,
  templateUrl: './course-enrollment-insert.html',
  styleUrl: './course-enrollment-insert.css',
})
export class CourseEnrollmentInsert implements OnInit {
    
    get idSchoolfb() { return this.frmCourseEnrollmentInsert.controls['idSchool']; }
    get idStudentfb() { return this.frmCourseEnrollmentInsert.controls['idStudent']; }

    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

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
        if (!this.frmCourseEnrollmentInsert.valid) {
            this.frmCourseEnrollmentInsert.markAllAsTouched();
            this.frmCourseEnrollmentInsert.markAllAsDirty();
            
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Complete todos los campos obligatorios.',
                life: 3000
            });
            return;
        }

        const idEstudianteFinal = this.idStudentfb.value ? this.idStudentfb.value.idStudent : null;
        const cursosSeleccionadosFinal = this.courseRowList
            .map(row => row.idCourseSelected ? row.idCourseSelected.idCourse : null)
            .filter(id => id != null);

        if (cursosSeleccionadosFinal.length === 0) {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Debe agregar y seleccionar al menos un curso.',
                life: 3000
            });
            return;
        }

        confirmAction(this.confirmationService, event, '¿Desea registrar esta matrícula?', () => {
            const bodyParams: Registercourseenrollment$Params = {
                body: {
                    idStudent: idEstudianteFinal,
                    courses: cursosSeleccionadosFinal as any
                }
            };

            this.api.invoke(registercourseenrollment, bodyParams).then((response: any) => {
                const apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
                if (apiResponse && apiResponse.type === 'error') {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: apiResponse.listMessage ? apiResponse.listMessage.join(', ') : 'Error al registrar la matrícula.',
                        life: 3000
                    });
                } else {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Matrícula registrada correctamente.',
                        life: 3000
                    });
                    this.frmCourseEnrollmentInsert.reset();
                    this.courseRowList = [];
                }
                this.cdr.detectChanges();
            }).catch((error) => {
                console.error("Error al registrar matrícula:", error);
                const errorMsg = error?.error?.message || error?.message || '';
                let detailMsg = 'Error al registrar la matrícula.';
                if (errorMsg && !errorMsg.includes('Http failure response') && !errorMsg.includes('500')) {
                    detailMsg = errorMsg;
                }
                this.messageService.add({ severity: 'error', summary: 'Error', detail: detailMsg, life: 5000 });
            });
        });
    }
}