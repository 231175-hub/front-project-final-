import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Api } from '../../../api/api';
// IMPORTANTE: Asegúrate de importar la función para buscar profesores (ej. searchprofessor)
import { getunassignedstudents, indexschool, registerschedule, Registerschedule$Params, searchcourse, getgroupwithcourse, searchproffesor } from '../../../api/functions';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

interface Day {
  name: string;
}

@Component({
  selector: 'app-schedule-insert',
  imports: [ ButtonModule, InputTextModule, SelectModule, AutoCompleteModule, FormsModule, ReactiveFormsModule ],
  standalone: true,
  templateUrl: './schedule-insert.html',
  styleUrl: './schedule-insert.css',
})
export class ScheduleInsert implements OnInit {
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
    let payload: any[] = [];

    this.coursesList.forEach(course => {
      course.groups.forEach((group: any) => {
        if (group.idGroupSelected && group.schedules.length > 0) {
          payload.push({
            idGroup: group.idGroupSelected,
            // Extraemos el ID del profesor seleccionado
            idProfessor: group.professorObject ? group.professorObject.idProfessor : null, 
            schedules: group.schedules.map((sched: any) => ({
              dayWeek: sched.dayWeek,
              startTime: sched.startTime,
              endTime: sched.endTime,
              classroom: sched.classroom // O "environment"
            }))
          });
        }
      });
    });

    console.log("Enviando JSON:", payload);

    const bodyParams: Registerschedule$Params = {
      body: payload
    };

    this.api.invoke(registerschedule, bodyParams).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      console.log('Respuesta del registro:', apiResponse);
      alert("¡Horario y docente registrados correctamente!");
    });
  }
}