import { Component, inject, signal } from '@angular/core';
import { registerproffesor, Registerproffesor$Params } from '../../../api/functions';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../../api/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-professor-insert',
  imports: [FormsModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule, ToastModule],
  standalone: true,
  providers: [MessageService],
  templateUrl: './professor-insert.html',
  styleUrl: './professor-insert.css',
})
export class ProfessorInsert {

  private messageService = inject(MessageService);
  public loading = signal<boolean>(false);

  get firstNamefb() {return this.frmInsertProfessor.controls['firstName']};
  get surNamefb() {return this.frmInsertProfessor.controls['surName']};
  get emailfb() {return this.frmInsertProfessor.controls['email']};
  get passwordfb() {return this.frmInsertProfessor.controls['password']};

  frmInsertProfessor: FormGroup;

  constructor(private formBiulder: FormBuilder, private api: Api) {
    this.frmInsertProfessor = this.formBiulder.group({
      'firstName': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$' )]],
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

  sendInsertProfessor(event: Event){
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

    const bodyParams: Registerproffesor$Params = {
      body: {
        'firstName': this.firstNamefb.value,
        'surName': this.surNamefb.value,
        'email': this.emailfb.value,
        'password': this.passwordfb.value,
      }
    }

    this.api.invoke(registerproffesor,  bodyParams).then((response: any) => {
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
        this.frmInsertProfessor.reset();
      }
      this.loading.set(false);
    }).catch((error) => {
      this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salio mal: ' + error});
      this.loading.set(false);
    });
  }
}
