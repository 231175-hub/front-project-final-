import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Api } from '../../../api/api';
// IMPORTANTE: Asegúrate de importar la función para buscar profesores (ej. searchprofessor)
import { getunassignedstudents, indexschool, registerschedule, Registerschedule$Params, searchcourse, getgroupwithcourse, searchproffesor } from '../../../api/functions';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgClass } from '@angular/common';

interface Day {
  name: string;
}

@Component({
  selector: 'app-schedule-insert',
  imports: [ ButtonModule, InputTextModule, SelectModule, AutoCompleteModule, FormsModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule, NgClass ],
  providers: [MessageService, ConfirmationService],
  standalone: true,
  templateUrl: './schedule-insert.html',
  styleUrl: './schedule-insert.css',
})
export class ScheduleInsert implements OnInit {
  get idSchoolfb() { return this.frmGroupAssignment.controls['idSchool']; }

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  frmGroupAssignment: FormGroup;
  coursesList: any[] = []; 
  listSchool: any[] = [];
  days: Day[] = [];
  courseSuggestions: any[] = [];
  
  // NUEVO: Arreglo para guardar los resultados de búsqueda de docentes
  professorSuggestions: any[] = []; 

  constructor(private api: Api, private cdr: ChangeDetectorRef, private formBuilder: FormBuilder) {
    this.frmGroupAssignment = this.formBuilder.group({
      idSchool: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.api.invoke(indexschool).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      this.listSchool = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
      this.cdr.markForCheck();
    });

    this.days = [
      { name: 'Lunes' }, 
      { name: 'Martes' }, 
      { name: 'Miercoles' }, 
      { name: 'Jueves' }, 
      { name: 'Viernes' }
    ];
  }

  addCourse(): void {
    this.coursesList.push({
      id: Date.now(),
      courseObject: null,
      availableGroups: [], 
      groups: []          
    });
  }

  removeCourse(course: any): void {
    const index = this.coursesList.indexOf(course);
    if (index !== -1) this.coursesList.splice(index, 1);
  }

  addGroup(course: any): void {
    if (!course.groups) course.groups = [];
    course.groups.push({
      id: Date.now(),
      idGroupSelected: null,
      professorObject: null, // NUEVO: Aquí se guardará el docente seleccionado
      schedules: []
    });
  }

  removeGroup(course: any, group: any): void {
    const index = course.groups.indexOf(group);
    if (index !== -1) course.groups.splice(index, 1);
  }

  addSchedule(group: any): void {
    if (!group.schedules) group.schedules = [];
    group.schedules.push({
      id: Date.now(),
      dayWeek: '',
      startTime: '',
      endTime: '',
      classroom: '' // Cambia a "environment" si tu Java lo espera así
    });
  }

  removeSchedule(group: any, schedule: any): void {
    const index = group.schedules.indexOf(schedule);
    if (index !== -1) group.schedules.splice(index, 1);
  }

  searchCourse(event: any, currentCourseRow: any): void {
    const term = event.query;
    const idSchoolValue = this.frmGroupAssignment.value.idSchool;
    if (!idSchoolValue) return;

    this.api.invoke(searchcourse, { query: term, idSchool: idSchoolValue }).then((res: any) => {
      let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
      let rawSuggestions = apiResponse.data ? apiResponse.data : apiResponse;

      const selectedCourseIds = this.coursesList
        .filter(c => c !== currentCourseRow && c.courseObject)
        .map(c => c.courseObject.idCourse);

      this.courseSuggestions = rawSuggestions.filter((curso: any) => !selectedCourseIds.includes(curso.idCourse));
      
      this.cdr.markForCheck();
    });
  }

  // --- NUEVO: BÚSQUEDA DE PROFESORES ---
  searchProfessorAutocomplete(event: any): void {
    const term = event.query;
    this.api.invoke(searchproffesor, { query: term }).then((res: any) => {
      let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
      this.professorSuggestions = apiResponse.data ? apiResponse.data : apiResponse;
      this.cdr.markForCheck();
    });
  }

  loadGroupsForCourse(courseItem: any): void {
    if (!courseItem.courseObject || !courseItem.courseObject.idCourse) return;

    this.api.invoke(getgroupwithcourse, { idCourse: courseItem.courseObject.idCourse }).then((res: any) => {
       let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
       courseItem.availableGroups = apiResponse.data ? apiResponse.data : apiResponse;
       this.cdr.markForCheck();
    });
  }

  getFilteredGroups(course: any, currentGroup: any): any[] {
    if (!course.availableGroups) return [];
    const selectedGroupIds = course.groups
      .filter((g: any) => g !== currentGroup && g.idGroupSelected)
      .map((g: any) => g.idGroupSelected);

    return course.availableGroups.filter((g: any) => !selectedGroupIds.includes(g.idGroup));
  }

  sendInsertSchedule(event: Event): void {
    if (!this.frmGroupAssignment.valid) {
      this.frmGroupAssignment.markAllAsTouched();
      this.frmGroupAssignment.markAllAsDirty();
      
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Complete todos los campos obligatorios (Escuela).',
        life: 3000
      });
      return;
    }

    let payload: any[] = [];

    this.coursesList.forEach(course => {
      course.groups.forEach((group: any) => {
        if (group.idGroupSelected && group.schedules.length > 0) {
          payload.push({
            idGroup: group.idGroupSelected,
            idProfessor: group.professorObject ? group.professorObject.idProfessor : null, 
            schedules: group.schedules.map((sched: any) => ({
              dayWeek: sched.dayWeek,
              startTime: sched.startTime,
              endTime: sched.endTime,
              classroom: sched.classroom 
            }))
          });
        }
      });
    });

    if (payload.length === 0) {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Debe registrar al menos un curso con sección y bloque horario.',
        life: 3000
      });
      return;
    }

    confirmAction(this.confirmationService, event, '¿Desea registrar los horarios asignados?', () => {
      const bodyParams: Registerschedule$Params = {
        body: payload
      };

      this.api.invoke(registerschedule, bodyParams).then((response: any) => {
        const apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
        if (apiResponse && apiResponse.type === 'error') {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: apiResponse.listMessage ? apiResponse.listMessage.join(', ') : 'Error al registrar el horario.',
            life: 3000
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Horarios y docentes registrados correctamente.',
            life: 3000
          });
          this.coursesList = [];
          this.frmGroupAssignment.reset();
        }
        this.cdr.detectChanges();
      }).catch((error) => {
        console.error("Error al registrar horario:", error);
        const errorMsg = error?.error?.message || error?.message || '';
        let detailMsg = 'Error al registrar el horario.';
        if (errorMsg && !errorMsg.includes('Http failure response') && !errorMsg.includes('500')) {
          detailMsg = errorMsg;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detailMsg, life: 5000 });
      });
    });
  }
}