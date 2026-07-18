import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { Api } from '../../../api/api';
import { indexproffesor, deleteproffesor, registerproffesor, Registerproffesor$Params, updateuser } from '../../../api/functions';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-professor-index',
  imports: [
    TableModule, TagModule, FormsModule, ReactiveFormsModule,
    ButtonModule, DialogModule, ToastModule, InputTextModule, PasswordModule
  ],
  providers: [MessageService],
  standalone: true,
  templateUrl: './professor-index.html',
  styleUrl: './professor-index.css',
})
export class ProfessorIndex implements OnInit {

  private messageService = inject(MessageService);
  public loading = signal<boolean>(false);

  listProfessor: any[] = [];
  cols!: Column[];

  // Modal state
  displayRegisterModal = false;
  isEditing = false;
  selectedProfessorId: string | null = null;

  // Form
  frmInsertProfessor: FormGroup;

  get firstNamefb() { return this.frmInsertProfessor.controls['firstName']; }
  get surNamefb() { return this.frmInsertProfessor.controls['surName']; }
  get emailfb() { return this.frmInsertProfessor.controls['email']; }
  get passwordfb() { return this.frmInsertProfessor.controls['password']; }

  constructor(private formBuilder: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
    this.frmInsertProfessor = this.formBuilder.group({
      'firstName': ['', [Validators.required]],
      'surName': ['', [Validators.required]],
      'email': ['', [Validators.required]],
      'password': ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cols = [
      { field: 'firstName', header: 'Nombres' },
      { field: 'surName', header: 'Apellidos' },
      { field: 'email', header: 'Email' },
      { field: 'actions', header: 'Acciones' }
    ];

    this.loadProfessors();
  }

  loadProfessors(): void {
    this.api.invoke(indexproffesor).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
      this.listProfessor = Array.isArray(apiResponse) ? apiResponse.map((prof: any) => ({
        ...prof,
        firstName: prof.parentUser ? prof.parentUser.firstName : (prof.firstName || 'N/A'),
        surName: prof.parentUser ? prof.parentUser.surName : (prof.surName || 'N/A'),
        email: prof.parentUser ? prof.parentUser.email : (prof.email || 'N/A'),
        idProffesor: prof.idProffesor || prof.idProfessor
      })) : [];
      this.cdr.detectChanges();
    }).catch((error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la lista de profesores.',
        life: 3000
      });
    });
  }

  // Modal actions
  openRegisterModal(): void {
    this.isEditing = false;
    this.selectedProfessorId = null;
    this.frmInsertProfessor.reset();

    // Set password validator back
    this.frmInsertProfessor.get('password')?.setValidators([Validators.required]);
    this.frmInsertProfessor.get('password')?.updateValueAndValidity();

    this.displayRegisterModal = true;
  }

  openEditModal(prof: any): void {
    this.isEditing = true;
    this.selectedProfessorId = prof.idProffesor;

    this.frmInsertProfessor.patchValue({
      firstName: prof.firstName,
      surName: prof.surName,
      email: prof.email,
      password: ''
    });

    // Clear password validator in edit mode
    this.frmInsertProfessor.get('password')?.clearValidators();
    this.frmInsertProfessor.get('password')?.updateValueAndValidity();

    this.displayRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.displayRegisterModal = false;
    this.frmInsertProfessor.reset();
    this.isEditing = false;
    this.selectedProfessorId = null;
  }

  // Register or Update professor
  sendInsertProfessor(): void {
    if (this.frmInsertProfessor.invalid) {
      this.frmInsertProfessor.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Complete todos los campos obligatorios.',
        life: 3000
      });
      return;
    }

    this.loading.set(true);

    if (this.isEditing) {
      // Edit mode: use updateuser
      const updateParams = {
        idUser: this.selectedProfessorId!,
        body: {
          firstName: this.firstNamefb.value,
          surName: this.surNamefb.value,
          email: this.emailfb.value
        }
      };

      this.api.invoke(updateuser, updateParams).then((response: any) => {
        const apiResponse = typeof response === 'string' ? JSON.parse(response) : response;

        if (apiResponse && apiResponse.type === 'error') {
          const errorDetail = apiResponse.listMessage ? apiResponse.listMessage.join(', ') : 'Error al actualizar.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorDetail,
            life: 5000
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Docente actualizado correctamente.',
            life: 3000
          });
          this.closeRegisterModal();
          this.loadProfessors();
        }
        this.loading.set(false);
      }).catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ups. Algo salió mal: ' + error,
          life: 5000
        });
        this.loading.set(false);
      });

    } else {
      // Register mode: use registerproffesor
      const bodyParams: Registerproffesor$Params = {
        body: {
          'firstName': this.firstNamefb.value,
          'surName': this.surNamefb.value,
          'email': this.emailfb.value,
          'password': this.passwordfb.value,
        }
      };

      this.api.invoke(registerproffesor, bodyParams).then((response: any) => {
        const apiResponse = typeof response === 'string' ? JSON.parse(response) : response;

        if (apiResponse && apiResponse.type === 'error') {
          const errorDetail = apiResponse.listMessage ? apiResponse.listMessage.join(', ') : 'Error de validación.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorDetail,
            life: 5000
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Docente registrado correctamente.',
            life: 3000
          });
          this.closeRegisterModal();
          this.loadProfessors();
        }
        this.loading.set(false);
      }).catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ups. Algo salió mal: ' + error,
          life: 5000
        });
        this.loading.set(false);
      });
    }
  }

  // Delete professor
  deleteProfessor(event: Event, idProffesor: string): void {
    this.api.invoke(deleteproffesor, { idProffesor }).then((response: any) => {
      this.listProfessor = this.listProfessor.filter(prof => prof.idProffesor !== idProffesor);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Docente eliminado correctamente.',
        life: 3000
      });
      this.cdr.detectChanges();
    }).catch((error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el docente.',
        life: 3000
      });
    });
  }
}
