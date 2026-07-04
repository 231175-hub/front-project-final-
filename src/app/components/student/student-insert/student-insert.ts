import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../../api/api';
import { indexschool, registerstudent, Registerstudent$Params } from '../../../api/functions';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { Button } from "primeng/button";

interface School {
  nameSchool: string;
  idSchool: string;
}

@Component({
  selector: 'app-student-insert',
  imports: [ReactiveFormsModule, InputTextModule, FormsModule, PasswordModule, SelectModule, Button],
  templateUrl: './student-insert.html',
  styleUrl: './student-insert.css',
})
export class StudentInsert implements OnInit{

  frmInsertStudent: FormGroup;

  listSchool: any[] =[];

  get firstNamefb() {return this.frmInsertStudent.controls['firstName']};
  get surNamefb() {return this.frmInsertStudent.controls['surName']};
  get emailfb() {return this.frmInsertStudent.controls['email']};
  get passwordfb() {return this.frmInsertStudent.controls['password']};
  get codefb() {return this.frmInsertStudent.controls['code']};
  get currentSemesterfb() {return this.frmInsertStudent.controls['currentSemester']};
  get totalCreditsfb() {return this.frmInsertStudent.controls['totalCredits']};
  get idSchoolfb() {return this.frmInsertStudent.controls['idSchool']};

  constructor(private formBuild: FormBuilder, private api: Api, private cdr: ChangeDetectorRef) {
    this.frmInsertStudent = formBuild.group({
      'firstName': ['', [Validators.required]],
      'surName': ['', [Validators.required]],
      'email': ['', [Validators.required]],
      'password': ['', [Validators.required]],
      'code': ['', [Validators.required]],
      'currentSemester': ['', [Validators.required]],
      'totalCredits': ['', [Validators.required]],
      'idSchool': ['', [Validators.required]] 
    });
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
    const bodyParams: Registerstudent$Params = {
      body: {
        'firstName': this.firstNamefb.value,
        'surName': this.surNamefb.value,
        'email': this.emailfb.value,
        'password': this.passwordfb.value,
        'code': this.codefb.value,
        'currentSemester': this.currentSemesterfb.value,
        'totalCredits': this.totalCreditsfb.value,
        'idSchool': this.idSchoolfb.value,
      }
    }

    this.api.invoke(registerstudent, bodyParams).then((response: any) => {
      let apiResponse = response ? JSON.parse(response) : response;
      this.frmInsertStudent.reset();
    });
  }
}
