import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Api } from '../../../api/api';
import { registeracademicperiod, Registeracademicperiod$Params, getacademicperiodstatuses } from '../../../api/functions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-academic-period-insert',
  standalone: true,
  imports: [ InputTextModule, FormsModule, ButtonModule, DatePickerModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule, NgClass, SelectModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './academic-period-insert.html',
  styleUrl: './academic-period-insert.css',
})
export class AcademicPeriodInsert implements OnInit {
  get yearPeriodfb() {return this.frmInsertAcademicPeriod.controls['yearPeriod']};
  get numberPeriodfb() {return this.frmInsertAcademicPeriod.controls['numberPeriod']};
  get startDatefb() {return this.frmInsertAcademicPeriod.controls['startDate']};
  get endDatefb() {return this.frmInsertAcademicPeriod.controls['endDate']};
  get statusfb() {return this.frmInsertAcademicPeriod.controls['status']};

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  frmInsertAcademicPeriod: FormGroup;
  listStatus: string[] = [];
  listPeriods: any[] = [
    { label: 'I', value: 1 },
    { label: 'II', value: 2 },
    { label: 'III', value: 3 }
  ];

  constructor(private formBuilder: FormBuilder, private api: Api) {
    this.frmInsertAcademicPeriod = this.formBuilder.group({
      'yearPeriod': ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      'numberPeriod': ['', [Validators.required]],
      'startDate': [null, Validators.required],
      'endDate': [null, [Validators.required]],
      'status': ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.api.invoke(getacademicperiodstatuses).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.listStatus = apiResponse;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error("Error al obtener los estados de periodo académico:", err);
    });
  }

  sendInsertAcademicPeriod(event: Event) {
    if (!this.frmInsertAcademicPeriod.valid) {
      this.frmInsertAcademicPeriod.markAllAsTouched();
      this.frmInsertAcademicPeriod.markAllAsDirty();

      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Complete todos los campos obligatorios.',
        life: 3000
      });
      return;
    }

    const startVal = this.startDatefb.value;
    const endVal = this.endDatefb.value;

    if (startVal && endVal) {
      const startDate = new Date(startVal);
      const endDate = new Date(endVal);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (startDate >= endDate) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Validación',
          detail: 'La fecha de inicio debe ser anterior a la fecha de fin.',
          life: 4000
        });
        return;
      }

      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 119) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Validación',
          detail: `El periodo académico debe durar al menos 119 días (actualmente dura ${diffDays} días).`,
          life: 4000
        });
        return;
      }
    }

    confirmAction(this.confirmationService, event, '¿Desea registrar este periodo académico?', () => {
      const bodyParams: Registeracademicperiod$Params = {
        body: {
          'yearPeriod': Number(this.yearPeriodfb.value),
          'numberPeriod': Number(this.numberPeriodfb.value),
          'startDate': this.startDatefb.value,
          'endDate': this.endDatefb.value,
          'status': this.statusfb.value
        }
      }

      this.api.invoke(registeracademicperiod, bodyParams).then((response: any) => {
        const apiResponse = typeof response === 'string' ? JSON.parse(response): response;
        if (apiResponse && apiResponse.type === 'error') {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: apiResponse.listMessage ? apiResponse.listMessage.join(', ') : 'Error al registrar el periodo académico.',
            life: 3000
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Periodo académico registrado correctamente.',
            life: 3000
          });
          this.frmInsertAcademicPeriod.reset();
        }
        this.cdr.detectChanges();
      }).catch((error) => {
        console.error("Error al registrar periodo académico:", error);
        let detailMsg = 'Ya existe un semestre activo o el periodo académico ya se encuentra registrado.';
        if (error?.error?.listMessage && error.error.listMessage.length > 0) {
          detailMsg = error.error.listMessage.join(', ');
        } else {
          const errorMsg = error?.error?.message || error?.message || '';
          if (errorMsg && !errorMsg.includes('Http failure response') && !errorMsg.includes('500')) {
            detailMsg = errorMsg;
          }
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detailMsg, life: 5000 });
      });
    });
  }
}
