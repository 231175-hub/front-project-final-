import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { Api } from '../../../api/api';
import { registeracademicperiod, Registeracademicperiod$Params, getacademicperiodstatuses, indexacademicperiod } from '../../../api/functions';
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
  academicPeriodList: any[] = [];
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
    }, { validators: this.dateRangeValidator() });
  }

  ngOnInit(): void {
    this.api.invoke(getacademicperiodstatuses).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.listStatus = apiResponse;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error("Error al obtener los estados de periodo académico:", err);
    });

    this.api.invoke(indexacademicperiod).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.academicPeriodList = parseResponse.data ? parseResponse.data : parseResponse;
    }).catch(err => {
      console.error("Error al obtener los periodos académicos:", err);
    });
  }

  dateRangeValidator(): any {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDateVal = group.get('startDate')?.value;
      const endDateVal = group.get('endDate')?.value;

      if (!startDateVal || !endDateVal) {
        return null;
      }

      const startDate = new Date(startDateVal);
      const endDate = new Date(endDateVal);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      const errors: ValidationErrors = {};

      if (startDate >= endDate) {
        errors['dateOrderInvalid'] = true;
      }

      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 119) {
        errors['durationInvalid'] = true;
      }

      const isOverlap = this.academicPeriodList.some(existing => {
        if (existing.status === 'Activo' || existing.status === 'Planificado') {
          const extStart = new Date(existing.startDate);
          const extEnd = new Date(existing.endDate);
          extStart.setHours(0, 0, 0, 0);
          extEnd.setHours(0, 0, 0, 0);

          return startDate.getTime() <= extEnd.getTime() && endDate.getTime() >= extStart.getTime();
        }
        return false;
      });

      if (isOverlap) {
        errors['overlapInvalid'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  blockNonDigits(event: KeyboardEvent): void {
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sendInsertAcademicPeriod(event: Event) {
    if (!this.frmInsertAcademicPeriod.valid) {
      this.frmInsertAcademicPeriod.markAllAsTouched();
      this.frmInsertAcademicPeriod.markAllAsDirty();

      let errorMsg = 'Complete todos los campos obligatorios.';
      if (this.frmInsertAcademicPeriod.hasError('dateOrderInvalid')) {
        errorMsg = 'La fecha de inicio debe ser anterior a la fecha de fin.';
      } else if (this.frmInsertAcademicPeriod.hasError('durationInvalid')) {
        errorMsg = 'El periodo académico debe durar al menos 119 días.';
      } else if (this.frmInsertAcademicPeriod.hasError('overlapInvalid')) {
        errorMsg = 'El periodo académico se superpone con otro periodo que se encuentra activo o planificado.';
      }

      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error de Validación', 
        detail: errorMsg,
        life: 4000
      });
      return;
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
        let detailMsg = 'Error al registrar el periodo académico.';
        if (error?.error?.listMessage && error.error.listMessage.length > 0) {
          detailMsg = error.error.listMessage.join(', ');
        } else {
          const errorMsg = error?.error?.message || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
          if (errorMsg) {
            detailMsg = `${detailMsg} (${errorMsg})`;
          }
        }
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detailMsg, life: 5000 });
      });
    });
  }
}
