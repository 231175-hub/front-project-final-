import { ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../../api/api';
import { indexschool, registerstudent, Registerstudent$Params } from '../../../api/functions';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Button } from "primeng/button";
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { inject } from '@angular/core';

interface School {
  nameSchool: string;
  idSchool: string;
}

@Component({
  selector: 'app-student-insert',
  imports: [ReactiveFormsModule, InputTextModule, FormsModule, PasswordModule, SelectModule, Button, ToastModule],
  providers: [MessageService],
  templateUrl: './student-insert.html',
  styleUrl: './student-insert.css',
})
export class StudentInsert implements OnInit{

  private messageService = inject(MessageService);
  public loading = signal<boolean>(false);

  frmInsertStudent: FormGroup;

  listSchool: any[] =[];

  get firstNamefb() {return this.frmInsertStudent.controls['firstName']};
  get surNamefb() {return this.frmInsertStudent.controls['surName']};
  get emailfb() {return this.frmInsertStudent.controls['email']};
  get passwordfb() {return this.frmInsertStudent.controls['password']};
  get codefb() {return this.frmInsertStudent.controls['code']};
  get totalCreditsfb() {return this.frmInsertStudent.controls['totalCredits']};
  get idSchoolfb() {return this.frmInsertStudent.controls['idSchool']};

  constructor(private formBuild: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
    this.frmInsertStudent = formBuild.group({
      'firstName': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$')]],
      'surName': ['', [Validators.required, Validators.pattern('^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]*$')]],
      'email': ['', [Validators.required]],
      'password': ['', [Validators.required]],
      'code': ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      'totalCredits': ['', [Validators.required, Validators.pattern('^[0-9]{1,3}$')]],
      'idSchool': ['', [Validators.required]] 
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

  ngOnInit(): void {
    this.api.invoke(indexschool).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
      this.listSchool = apiResponse;
      this.cdr.detectChanges();
    });
  }

  sendInsertStudent(event: Event) {
    if (this.frmInsertStudent.invalid) {
      this.frmInsertStudent.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Complete todos los campos obligatorios.',
        life: 3000
      });
      return;
    }

    this.loading.set(true);

    const bodyParams: Registerstudent$Params = {
      body: {
        'firstName': this.firstNamefb.value,
        'surName': this.surNamefb.value,
        'email': this.emailfb.value,
        'password': this.passwordfb.value,
        'code': this.codefb.value,
        'totalCredits': this.totalCreditsfb.value,
        'idSchool': this.idSchoolfb.value,
      }
    }

    this.api.invoke(registerstudent, bodyParams).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      
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
          detail: 'Estudiante registrado correctamente.',
          life: 3000
        });
        this.frmInsertStudent.reset();
      }
      this.loading.set(false);
    }).catch((error) => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ups. Algo salió mal al registrar al estudiante: ' + error,
        life: 5000
      });
      this.loading.set(false);
    });
  }
}
