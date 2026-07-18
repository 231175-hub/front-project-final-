import { Component, inject, OnInit } from '@angular/core';
import { Api } from '../../../api/api';
import { ActivatedRoute } from '@angular/router';
import { registeracademicperiod, Registeracademicperiod$Params, showacademicperiod, updateacademicperiod, Updateacademicperiod$Params } from '../../../api/functions';
import { ConfirmationService, MessageService } from 'primeng/api';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { NgClass } from '@angular/common';
import { SelectModule } from 'primeng/select';

interface Status {
  status: string;
}

@Component({
  selector: 'app-academic-period-update',
  imports: [InputTextModule, FormsModule, ButtonModule, DatePickerModule, ReactiveFormsModule, ToastModule, ConfirmDialogModule, NgClass, SelectModule],
  standalone: true,
  providers: [MessageService, ConfirmationService],
  templateUrl: './academic-period-update.html',
  styleUrl: './academic-period-update.css',
})

export class AcademicPeriodUpdate implements OnInit{

  get yearPeriodfb() {return this.frmUpdateAcademicPeriod.controls['yearPeriod']};
  get numberPeriodfb() {return this.frmUpdateAcademicPeriod.controls['numberPeriod']};
  get startDatefb() {return this.frmUpdateAcademicPeriod.controls['startDate']};
  get endDatefb() {return this.frmUpdateAcademicPeriod.controls['endDate']};
  get statusfb() {return this.frmUpdateAcademicPeriod.controls['status']}

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  frmUpdateAcademicPeriod: FormGroup;

  statuses: Status[] = [];

  constructor(private api: Api, private route: ActivatedRoute, private formBuilder: FormBuilder) {
    this.frmUpdateAcademicPeriod = this.formBuilder.group({
      'yearPeriod': ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      'numberPeriod': ['', [Validators.required]],
      'startDate': [null, Validators.required],
      'endDate': [null, [Validators.required]],
      'status': ['', [Validators.required]]
    });
  }

  idAcademicPeriod: any;

  academicPeriod: [] = [];

  ngOnInit(): void {
    this.idAcademicPeriod = this.route.snapshot.paramMap.get('idAcademicPeriod');

    this.api.invoke(showacademicperiod, {idPeriod: this.idAcademicPeriod}).then((response: any) => {
      let apiAcademicPeriodTemp = typeof response === 'string' ? JSON.parse(response) : response;
      let apiAcademicPeriod = apiAcademicPeriodTemp.data ? apiAcademicPeriodTemp.data : apiAcademicPeriodTemp;

      this.academicPeriod = apiAcademicPeriod;

      const setValue = {
        yearPeriod: apiAcademicPeriod.yearPeriod,
        numberPeriod: apiAcademicPeriod.numberPeriod,
        startDate: new Date(apiAcademicPeriod.startDate),
        endDate: new Date (apiAcademicPeriod.endDate),
        status: apiAcademicPeriod.status,
      }

      this.frmUpdateAcademicPeriod.patchValue(setValue);
    });

    this.statuses = [
      { status: 'Planificado' },
      { status: 'Activo'},
      { status: 'Finalizado'},
      { status: 'Cerrado'},
      { status: 'Cancelado'}
    ];
  }

  sendInsertAcademicPeriod(event: Event) {
      if (!this.frmUpdateAcademicPeriod.valid) {
        this.frmUpdateAcademicPeriod.markAllAsTouched();
        this.frmUpdateAcademicPeriod.markAllAsDirty();
  
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los datos fatantes. Por favor.' });
        return
      }
  
      confirmAction(this.confirmationService, event, '¿Desea ingresar esta escuela?', () => {
        const bodyParams: Updateacademicperiod$Params = {
          idPeriod: this.idAcademicPeriod,
          body: {
            'yearPeriod': this.yearPeriodfb.value,
            'numberPeriod': this.numberPeriodfb.value,
            'startDate': this.startDatefb.value,
            'endDate': this.endDatefb.value,
            'status': this.statusfb.value,
          }
        }

        this.api.invoke(updateacademicperiod, bodyParams).then((response: any) => {
          const updateAcademicPeriod = typeof response === 'string' ? JSON.parse(response): response;
          this.frmUpdateAcademicPeriod.reset();
        }).catch((error) => {
          console.error("Error al actualizar periodo académico:", error);
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
