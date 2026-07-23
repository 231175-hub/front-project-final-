import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Api } from '../../../api/api';
import { searchcourse, showschool, updatecourse, deletecourse } from '../../../api/functions';
import { enviroments } from '../../../enviroments/envitoments';
import { confirmAction } from '../../../core/utils/confirm.helper';

@Component({
  selector: 'app-school-courses',
  imports: [
    CommonModule, 
    TableModule, 
    ButtonModule, 
    CardModule, 
    DialogModule, 
    ConfirmDialogModule, 
    ToastModule, 
    InputTextModule, 
    SelectModule, 
    ReactiveFormsModule
  ],
  providers: [MessageService, ConfirmationService],
  standalone: true,
  templateUrl: './school-courses.html',
  styleUrl: './school-courses.css'
})
export class SchoolCoursesComponent implements OnInit {
  idSchool: string | null = null;
  school: any = null;
  coursesList: any[] = [];
  loading: boolean = false;
  public env = enviroments;

  displayEditDialog: boolean = false;
  frmUpdateCourse: FormGroup;
  selectedCourse: any = null;
  categories = [ 
    { category: 'AFPO'},
    { category: 'AFPE' }
  ];

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);
  private formBuilder = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  get codefb() { return this.frmUpdateCourse.controls['code']; }
  get creditsfb() { return this.frmUpdateCourse.controls['credits']; }
  get nameCoursefb() { return this.frmUpdateCourse.controls['nameCourse']; }
  get categoryfb() { return this.frmUpdateCourse.controls['category']; }

  constructor() {
    this.frmUpdateCourse = this.formBuilder.group({
      'code': ['', [Validators.required]],
      'credits': ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      'nameCourse': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$')]],
      'category': ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.idSchool = this.route.snapshot.paramMap.get('idSchool');
    if (this.idSchool) {
      this.loadSchoolDetails();
      this.loadCourses();
    }
  }

  loadSchoolDetails(): void {
    this.api.invoke(showschool, { idSchool: this.idSchool! }).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.school = parseResponse.data ? parseResponse.data : parseResponse;
      this.cdr.detectChanges();
    }).catch((err) => {
      console.error('Error loading school details:', err);
    });
  }

  loadCourses(): void {
    this.loading = true;
    this.api.invoke(searchcourse, { idSchool: this.idSchool!, query: '' }).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.coursesList = parseResponse.data ? parseResponse.data : parseResponse;
      this.loading = false;
      this.cdr.detectChanges();
    }).catch((err) => {
      console.error('Error loading courses:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  openEditDialog(course: any): void {
    this.selectedCourse = course;
    this.frmUpdateCourse.patchValue({
      code: course.code,
      credits: course.credits != null ? String(course.credits) : '',
      nameCourse: course.nameCourse,
      category: course.category
    });
    this.displayEditDialog = true;
  }

  updateCourse(event: Event): void {
    if (this.frmUpdateCourse.invalid) {
      this.frmUpdateCourse.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Complete todos los campos obligatorios y con formato correcto.',
        life: 3000
      });
      return;
    }

    confirmAction(this.confirmationService, event, '¿Desea guardar los cambios de este curso?', () => {
      const bodyParams = {
        idCourse: this.selectedCourse.idCourse,
        body: {
          code: this.codefb.value,
          credits: Number(this.creditsfb.value),
          nameCourse: this.nameCoursefb.value,
          category: this.categoryfb.value,
          idSchool: this.idSchool!
        }
      };

      this.api.invoke(updatecourse, bodyParams).then((response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Curso actualizado correctamente.',
          life: 3000
        });
        this.displayEditDialog = false;
        this.loadCourses();
      }).catch((err) => {
        console.error('Error al actualizar el curso:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ups. Algo salió mal al actualizar el curso.',
          life: 3000
        });
      });
    });
  }

  delete(idCourse: string, event: Event): void {
    confirmAction(this.confirmationService, event, '¿Desea eliminar este curso?', () => {
      this.api.invoke(deletecourse, { idCourse }).then((response: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Curso eliminado correctamente.',
          life: 3000
        });
        this.loadCourses();
      }).catch((err) => {
        console.error('Error al eliminar el curso:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ups. Algo salió mal al eliminar el curso.',
          life: 3000
        });
      });
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

  goBack(): void {
    this.router.navigate(['/admin/dashboard/indexSchool']);
  }
}
