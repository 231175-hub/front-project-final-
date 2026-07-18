import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { assigngroups, getunassignedstudents, indexschool, searchcourse } from '../../../api/functions';
import { Api } from '../../../api/api';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-assign-groups',
  imports: [FormsModule, ReactiveFormsModule, SelectModule, AutoCompleteModule, ButtonModule, ToastModule, ConfirmDialogModule, NgClass],
  providers: [MessageService, ConfirmationService],
  standalone: true,
  templateUrl: './assign-groups.html',
  styleUrl: './assign-groups.css',
})
export class AssignGroups implements OnInit{
  get idSchoolfb() { return this.frmGroupAssignment.controls['idSchool']; }
  get courseObjectfb() { return this.frmGroupAssignment.controls['courseObject']; }

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

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

  assignRandomGroups(event: Event): void {
    if (this.unassignedStudents.length === 0) {
      return;
    }

    confirmAction(this.confirmationService, event, '¿Desea generar y asignar los grupos automáticamente para este curso?', () => {
      const payload = {
        body: {
          idCourse: this.frmGroupAssignment.value.courseObject.idCourse
        }
      };

      this.api.invoke(assigngroups, payload).then((res: any) => {
        const apiResponse = typeof res === 'string' ? JSON.parse(res) : res;
        if (apiResponse && apiResponse.type === 'error') {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: apiResponse.listMessage ? apiResponse.listMessage.join(', ') : 'Error al asignar grupos.',
            life: 3000
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Grupos generados y asignados correctamente.',
            life: 3000
          });
          this.unassignedStudents = []; 
          this.frmGroupAssignment.controls['courseObject'].setValue(null); 
        }
        this.cdr.markForCheck();
      }).catch((error) => {
        console.error("Error asignando grupos", error);
        const errorMsg = error?.error?.message || error?.message || '';
        let detailMsg = 'Error al asignar grupos.';
        if (errorMsg && !errorMsg.includes('Http failure response') && !errorMsg.includes('500')) {
          detailMsg = errorMsg;
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detailMsg, life: 5000 });
      });
    });
  }
}
