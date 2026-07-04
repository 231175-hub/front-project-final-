import { Component, inject } from '@angular/core';
import { registerproffesor, Registerproffesor$Params } from '../../../api/functions';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../../api/api';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-professor-insert',
  imports: [FormsModule, ReactiveFormsModule, InputTextModule, PasswordModule, ButtonModule],
  standalone: true,
  providers: [MessageService],
  templateUrl: './professor-insert.html',
  styleUrl: './professor-insert.css',
})
export class ProfessorInsert {

  private messageService = inject(MessageService);

  get firstNamefb() {return this.frmInsertProfessor.controls['firstName']};
  get surNamefb() {return this.frmInsertProfessor.controls['surName']};
  get emailfb() {return this.frmInsertProfessor.controls['email']};
  get passwordfb() {return this.frmInsertProfessor.controls['password']};

  frmInsertProfessor: FormGroup;

  constructor(private formBiulder: FormBuilder, private api: Api) {
    this.frmInsertProfessor = this.formBiulder.group({
      'firstName': ['', [Validators.required]],
      'surName': ['', Validators.required],
      'email': ['', [Validators.required]],
      'password': ['', [Validators.required]]
    });
  }

  sendInsertProfessor(event: Event){
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
        this.frmInsertProfessor.reset();
      }).catch((error) => {
        this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salio mal' + error});
      });
    }
}
