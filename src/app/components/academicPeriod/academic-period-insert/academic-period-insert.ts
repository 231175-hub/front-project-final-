import { Component, inject, Inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { Api } from '../../../api/api';
import { registeracademicperiod, Registeracademicperiod$Params } from '../../../api/functions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-academic-period-insert',
  standalone: true,
  imports: [ InputTextModule, FormsModule, ButtonModule, DatePickerModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule, NgClass],
  providers: [MessageService, ConfirmationService],
  templateUrl: './academic-period-insert.html',
  styleUrl: './academic-period-insert.css',
})
export class AcademicPeriodInsert{
  get yearPeriodfb() {return this.frmInsertAcademicPeriod.controls['yearPeriod']};
  get numberPeriodfb() {return this.frmInsertAcademicPeriod.controls['numberPeriod']};
  get startDatefb() {return this.frmInsertAcademicPeriod.controls['startDate']};
  get endDatefb() {return this.frmInsertAcademicPeriod.controls['endDate']};

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  frmInsertAcademicPeriod: FormGroup;

  constructor(private formBuilder: FormBuilder, private api: Api) {
    this.frmInsertAcademicPeriod = this.formBuilder.group({
      'yearPeriod': ['', [Validators.required]],
      'numberPeriod': ['', [Validators.required]],
      'startDate': [null, Validators.required],
      'endDate': [null, [Validators.required]]
    });
  }

  sendInsertAcademicPeriod(event: Event) {
    if (!this.frmInsertAcademicPeriod.valid) {
      this.frmInsertAcademicPeriod.markAllAsTouched();
      this.frmInsertAcademicPeriod.markAllAsDirty();

      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los datos fatantes. Por favor.' });
      return
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Desea ingresar esta escuela?',
      header: 'Confirmación',
      icon: 'pi-pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true
      },
      acceptButtonProps:{
        label: 'Aceptar',
        severity: 'primary'
      },

      accept: () => {
        const bodyParams: Registeracademicperiod$Params = {
          body: {
            'yearPeriod': this.yearPeriodfb.value,
            'numberPeriod': this.numberPeriodfb.value,
            'startDate': this.startDatefb.value,
            'endDate': this.endDatefb.value,
          }
        }

        this.api.invoke(registeracademicperiod, bodyParams).then((response: any) => {
          const registerAcademicPeriod = typeof response === 'string' ? JSON.parse(response): response;
          this.frmInsertAcademicPeriod.reset();
        }).catch((error) => {
          this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salio mal' + error});
        });
      },
      reject: () => {}
    });
  }
}
