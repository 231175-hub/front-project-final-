import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Api } from '../../../api/api';
import { deleteacademicperiod, indexacademicperiod, registeracademicperiod, Registeracademicperiod$Params, updateacademicperiod, Updateacademicperiod$Params, getacademicperiodstatuses } from '../../../api/functions';
import { TagModule } from 'primeng/tag';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Button } from 'primeng/button';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { CommonModule } from '@angular/common';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-academic-period-index',
  imports: [ TableModule, TagModule, FormsModule, ReactiveFormsModule, Button, DatePickerModule, SelectModule, DialogModule, ToastModule, ConfirmDialogModule, InputTextModule, CommonModule ],
  providers: [ Api, MessageService, ConfirmationService ],
  standalone: true,
  templateUrl: './academic-period-index.html',
  styleUrl: './academic-period-index.css',
})
export class AcademicPeriodIndex implements OnInit {  
  academicPeriodList: any[] = [];
  cols!: Column[];

  // Modal State
  displayRegisterModal = false;
  isEditing = false;
  selectedPeriodId: string | null = null;
  loading = false;

  // Form Group
  frmAcademicPeriod!: FormGroup;
  listStatus: string[] = ['Planificado', 'Activo', 'Finalizado', 'Cerrado', 'Cancelado'];
  listPeriods: any[] = [
    { label: 'Semestre I (0)', value: 0 },
    { label: 'Semestre II (1)', value: 1 },
    { label: 'Semestre III (2)', value: 2 }
  ];

  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private formBuilder = inject(FormBuilder);

  get yearPeriodfb() { return this.frmAcademicPeriod.controls['yearPeriod']; }
  get numberPeriodfb() { return this.frmAcademicPeriod.controls['numberPeriod']; }
  get startDatefb() { return this.frmAcademicPeriod.controls['startDate']; }
  get endDatefb() { return this.frmAcademicPeriod.controls['endDate']; }
  get statusfb() { return this.frmAcademicPeriod.controls['status']; }

  constructor(private api: Api, private cdr: ChangeDetectorRef, private router: Router){}

  ngOnInit(): void {
    this.cols = [
      { field: 'yearPeriod', header: 'Año' },
      { field: 'numberPeriod', header: 'Periodo' },
      { field: 'startDateStr', header: 'Fecha Inicio' },
      { field: 'endDateStr', header: 'Fecha Fin' },
      { field: 'status', header: 'Estado' },
      { field: 'actions', header: 'Acciones' }
    ];

    this.frmAcademicPeriod = this.formBuilder.group({
      'yearPeriod': ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
      'numberPeriod': [null, [Validators.required]],
      'startDate': [null, Validators.required],
      'endDate': [null, Validators.required],
      'status': ['', [Validators.required]]
    });

    this.loadAcademicPeriods();
  }

  loadAcademicPeriods(): void {
    this.api.invoke(indexacademicperiod).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      let tempAcademicPeriod = parseResponse.data ? parseResponse.data : parseResponse;

      this.academicPeriodList = Array.isArray(tempAcademicPeriod) ? tempAcademicPeriod.map((academicPeriod: any) => {
        academicPeriod.rawStartDate = new Date(academicPeriod.startDate);
        academicPeriod.rawEndDate = new Date(academicPeriod.endDate);
        academicPeriod.startDateStr = new Date(academicPeriod.startDate).toLocaleDateString('es-ES');
        academicPeriod.endDateStr = new Date(academicPeriod.endDate).toLocaleDateString('es-ES');
        return academicPeriod;
      }) : [];

      this.cdr.detectChanges();
    }).catch(error => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los periodos académicos.',
        life: 3000
      });
    });
  }

  openRegisterModal(): void {
    this.isEditing = false;
    this.selectedPeriodId = null;
    this.frmAcademicPeriod.reset();
    this.displayRegisterModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(period: any): void {
    this.isEditing = true;
    this.selectedPeriodId = period.idPeriod;
    this.frmAcademicPeriod.reset();
    
    this.frmAcademicPeriod.patchValue({
      yearPeriod: period.yearPeriod,
      numberPeriod: period.numberPeriod,
      startDate: period.rawStartDate,
      endDate: period.rawEndDate,
      status: period.status
    });

    this.displayRegisterModal = true;
    this.cdr.detectChanges();
  }

  closeRegisterModal(): void {
    this.displayRegisterModal = false;
    this.frmAcademicPeriod.reset();
    this.isEditing = false;
    this.selectedPeriodId = null;
  }

  saveAcademicPeriod(event: Event): void {
    if (this.frmAcademicPeriod.invalid) {
      this.frmAcademicPeriod.markAllAsTouched();
      this.frmAcademicPeriod.markAllAsDirty();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Complete todos los campos obligatorios.',
        life: 3000
      });
      return;
    }

    this.loading = true;

    // Convert dates to ISO format or string as expected by backend
    const formatLocalDate = (dateVal: any): string | undefined => {
      if (!dateVal) return undefined;
      const d = new Date(dateVal);
      const month = '' + (d.getMonth() + 1);
      const day = '' + d.getDate();
      const year = d.getFullYear();
      return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    };

    if (this.isEditing) {
      confirmAction(this.confirmationService, event, '¿Desea actualizar este periodo académico?', () => {
        const bodyParams: Updateacademicperiod$Params = {
          idPeriod: this.selectedPeriodId!,
          body: {
            yearPeriod: Number(this.yearPeriodfb.value),
            numberPeriod: Number(this.numberPeriodfb.value),
            startDate: formatLocalDate(this.startDatefb.value),
            endDate: formatLocalDate(this.endDatefb.value),
            status: this.statusfb.value
          }
        };

        this.api.invoke(updateacademicperiod, bodyParams).then((response: any) => {
          this.displayRegisterModal = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Periodo académico actualizado correctamente.',
            life: 3000
          });
          this.loadAcademicPeriods();
          this.loading = false;
        }).catch((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Exception',
            detail: 'Ups. Algo salió mal: ' + error
          });
          this.loading = false;
        });
      }, () => { this.loading = false; });
    } else {
      confirmAction(this.confirmationService, event, '¿Desea registrar este periodo académico?', () => {
        const bodyParams: Registeracademicperiod$Params = {
          body: {
            yearPeriod: Number(this.yearPeriodfb.value),
            numberPeriod: Number(this.numberPeriodfb.value),
            startDate: formatLocalDate(this.startDatefb.value),
            endDate: formatLocalDate(this.endDatefb.value),
            status: this.statusfb.value
          }
        };

        this.api.invoke(registeracademicperiod, bodyParams).then((response: any) => {
          this.displayRegisterModal = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Periodo académico registrado correctamente.',
            life: 3000
          });
          this.loadAcademicPeriods();
          this.loading = false;
        }).catch((error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Exception',
            detail: 'Ups. Algo salió mal: ' + error
          });
          this.loading = false;
        });
      }, () => { this.loading = false; });
    }
  }

  deleteAcademicPeriod(event: Event, idAcademicPeriod: any) {
    confirmAction(this.confirmationService, event, '¿Está seguro de eliminar este periodo académico?', () => {
      this.api.invoke(deleteacademicperiod, { idPeriod: idAcademicPeriod }).then((response: any) => {
        this.academicPeriodList = this.academicPeriodList.filter(period => period.idPeriod !== idAcademicPeriod);
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Periodo académico eliminado correctamente.',
          life: 3000
        });
        this.cdr.detectChanges();
      }).catch((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el periodo académico.'
        });
      });
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Activo':
        return 'success';
      case 'Planificado':
        return 'info';
      case 'Finalizado':
        return 'warn';
      case 'Cerrado':
        return 'secondary';
      case 'Cancelado':
        return 'danger';
      default: return 'info';
    }
  }
}
