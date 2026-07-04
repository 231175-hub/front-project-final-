import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { assigngroups, getunassignedstudents, indexschool, searchcourse } from '../../../api/functions';
import { Api } from '../../../api/api';

@Component({
  selector: 'app-assign-groups',
  imports: [FormsModule, ReactiveFormsModule, SelectModule, AutoCompleteModule, ButtonModule],
  standalone: true,
  templateUrl: './assign-groups.html',
  styleUrl: './assign-groups.css',
})
export class AssignGroups implements OnInit{
  frmGroupAssignment: FormGroup;
  listSchool: any[] = [];
  courseSuggestions: any[] = [];
  unassignedStudents: any[] = []; 

  constructor(private formBiulder: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
    this.frmGroupAssignment = this.formBiulder.group({
      idSchool: [null, Validators.required],
      courseObject: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.api.invoke(indexschool).then((response: any) => {
    let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.listSchool = apiResponse.data ? apiResponse.data : apiResponse;
      this.cdr.markForCheck();
    });
  }

  searchCourse(event: any): void {
    const term = event.query;
    const idSchoolValue = this.frmGroupAssignment.value.idSchool;

    if (!idSchoolValue) return;

    this.api.invoke(searchcourse, { query: term, idSchool: idSchoolValue }).then((res: any) => {
      let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
      this.courseSuggestions = [...(apiResponse.data ? apiResponse.data : apiResponse)];
      this.cdr.markForCheck();
    });
  }

  loadUnassignedStudents(): void {
    const idCourseSelected = this.frmGroupAssignment.value.courseObject.idCourse;
    
    this.api.invoke(getunassignedstudents, { idCourse: idCourseSelected }).then((res: any) => {
          let apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
          this.unassignedStudents = apiResponse.data ? apiResponse.data : apiResponse;
          this.cdr.markForCheck();
    });
  }

  assignRandomGroups(): void {
    const payload = {
      body: {
        idCourse: this.frmGroupAssignment.value.courseObject.idCourse
      }
    };

    this.api.invoke(assigngroups, payload).then((res: any) => {
      console.log("¡Éxito!");
      this.unassignedStudents = []; 
      this.frmGroupAssignment.controls['courseObject'].setValue(null); 
      this.cdr.markForCheck();
    }).catch((error) => {
      console.error("Error asignando grupos", error);
    });
  }
}
