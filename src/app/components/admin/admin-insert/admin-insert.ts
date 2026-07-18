import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Api } from '../../../api/api';
import { registeruser, Registeruser$Params } from '../../../api/functions';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-admin-insert',
  imports: [ReactiveFormsModule, InputTextModule, FormsModule, PasswordModule, ButtonModule, ToastModule],
  providers: [MessageService],
  standalone: true,
  templateUrl: './admin-insert.html',
  styleUrl: './admin-insert.css',
})
export class AdminInsert {

  private messageService = inject(MessageService);

  get firstNamefb() {return this.frmInsertAdmin.controls['firstName']};
  get surNamefb() {return this.frmInsertAdmin.controls['surName']};
  get emailfb() {return this.frmInsertAdmin.controls['email']};
  get passwordfb() {return this.frmInsertAdmin.controls['password']};

  frmInsertAdmin: FormGroup;

  constructor(private formBiulder: FormBuilder, private api: Api) {
    this.frmInsertAdmin = this.formBiulder.group({
      'firstName': ['', [Validators.required]],
      'surName': ['', Validators.required],
      'email': ['', [Validators.required]],
      'password': ['', [Validators.required]]
    });
  }

  sendInsertAdmin(event: Event){
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

    const bodyParams: Registeruser$Params = {
      body: {
        'firstName': this.firstNamefb.value,
        'surName': this.surNamefb.value,
        'email': this.emailfb.value,
        'password': this.passwordfb.value,
      }
    }

    this.api.invoke(registeruser,  bodyParams).then((response: any) => {
      const apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Administrador registrado correctamente.',
        life: 3000
      });
      this.frmInsertAdmin.reset();
    }).catch((error) => {
      this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salio mal: ' + error});
    });
  }
}
