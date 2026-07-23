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
import { indexuser, deleteuser, registeruser, Registeruser$Params, updateuser } from '../../../api/functions';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-admin-index',
  imports: [
    TableModule, TagModule, FormsModule, ReactiveFormsModule,
    ButtonModule, DialogModule, ToastModule, InputTextModule, PasswordModule
  ],
  providers: [MessageService],
  standalone: true,
  templateUrl: './admin-index.html',
  styleUrl: './admin-index.css',
})
export class AdminIndex implements OnInit {

  private messageService = inject(MessageService);
  public loading = signal<boolean>(false);

  listAdmin: any[] = [];
  cols!: Column[];

  // Modal state
  displayRegisterModal = false;
  isEditing = false;
  selectedAdminId: string | null = null;

  // Form
  frmInsertAdmin: FormGroup;

  get firstNamefb() { return this.frmInsertAdmin.controls['firstName']; }
  get surNamefb() { return this.frmInsertAdmin.controls['surName']; }
  get emailfb() { return this.frmInsertAdmin.controls['email']; }
  get passwordfb() { return this.frmInsertAdmin.controls['password']; }

  constructor(private formBuilder: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
    this.frmInsertAdmin = this.formBuilder.group({
      'firstName': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$')]],
      'surName': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$')]],
      'email': ['', [Validators.required]],
      'password': ['', [Validators.required]]
    });
  }

  blockNonLetters(event: KeyboardEvent): void {
    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  ngOnInit(): void {
    this.cols = [
      { field: 'firstName', header: 'Nombres' },
      { field: 'surName', header: 'Apellidos' },
      { field: 'email', header: 'Email' },
      { field: 'actions', header: 'Acciones' }
    ];

    this.loadAdmins();
  }

  loadAdmins(): void {
    this.api.invoke(indexuser).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
      this.listAdmin = Array.isArray(apiResponse) ? apiResponse : [];
      this.cdr.detectChanges();
    }).catch((error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la lista de administradores.',
        life: 3000
      });
    });
  }

  // Modal actions
  openRegisterModal(): void {
    this.isEditing = false;
    this.selectedAdminId = null;
    this.frmInsertAdmin.reset();
    
    // Set password validator back
    this.frmInsertAdmin.get('password')?.setValidators([Validators.required]);
    this.frmInsertAdmin.get('password')?.updateValueAndValidity();
    
    this.displayRegisterModal = true;
  }

  openEditModal(admin: any): void {
    this.isEditing = true;
    this.selectedAdminId = admin.idUser;
    
    this.frmInsertAdmin.patchValue({
      firstName: admin.firstName,
      surName: admin.surName,
      email: admin.email,
      password: ''
    });

    // Clear password validator in edit mode
    this.frmInsertAdmin.get('password')?.clearValidators();
    this.frmInsertAdmin.get('password')?.updateValueAndValidity();

    this.displayRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.displayRegisterModal = false;
    this.frmInsertAdmin.reset();
    this.isEditing = false;
    this.selectedAdminId = null;
  }

  // Register or Update admin
  sendInsertAdmin(): void {
    if (this.frmInsertAdmin.invalid) {
      this.frmInsertAdmin.markAllAsTouched();
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
      // Edit mode: invoke updateuser
      const updateParams = {
        idUser: this.selectedAdminId!,
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
            detail: 'Administrador actualizado correctamente.',
            life: 3000
          });
          this.closeRegisterModal();
          this.loadAdmins();
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
      // Register mode: invoke registeruser
      const bodyParams: Registeruser$Params = {
        body: {
          'firstName': this.firstNamefb.value,
          'surName': this.surNamefb.value,
          'email': this.emailfb.value,
          'password': this.passwordfb.value,
        }
      };

      this.api.invoke(registeruser, bodyParams).then((response: any) => {
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
            detail: 'Administrador registrado correctamente.',
            life: 3000
          });
          this.closeRegisterModal();
          this.loadAdmins();
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

  // Delete admin
  deleteAdmin(event: Event, idUser: string): void {
    this.api.invoke(deleteuser, { idUser }).then((response: any) => {
      this.listAdmin = this.listAdmin.filter(admin => admin.idUser !== idUser);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Administrador eliminado correctamente.',
        life: 3000
      });
      this.cdr.detectChanges();
    }).catch((error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el administrador.',
        life: 3000
      });
    });
  }
}
