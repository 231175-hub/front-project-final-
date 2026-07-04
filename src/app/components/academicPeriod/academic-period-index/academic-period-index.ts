import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Api } from '../../../api/api';
import { deleteacademicperiod, indexacademicperiod } from '../../../api/functions';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';


interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-academic-period-index',
  imports: [ TableModule, TagModule, FormsModule, Button ],
  providers: [ Api ],
  standalone: true,
  templateUrl: './academic-period-index.html',
  styleUrl: './academic-period-index.css',
})
export class AcademicPeriodIndex implements OnInit{  
  academicPeriodList: any[] = [];
  cols!: Column[];

  constructor(private api: Api, private cdr: ChangeDetectorRef, private router: Router){}

  ngOnInit(): void {
    this.cols = [
      { field: 'yearPeriod', header: 'Año' },
      { field: 'numberPeriod', header: 'Periodo' },
      { field: 'startDate', header: 'Fecha Inicio' },
      { field: 'endDate', header: 'Fecha Fin' },
      { field: 'status', header: 'Estado' },
      { field: 'update', header: 'Actualizar' },
      {field: 'delete', header: 'Eliminar'}
    ];

    this.api.invoke(indexacademicperiod).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      let tempAcademicPeriod = parseResponse.data ? parseResponse.data : parseResponse;

      this.academicPeriodList = tempAcademicPeriod.map((academicPeriod: any) => {
        academicPeriod.startDate = new Date(academicPeriod.startDate).toLocaleDateString('es-ES');
        academicPeriod.endDate = new Date(academicPeriod.endDate).toLocaleDateString('es-ES');
        return academicPeriod;
      });

      this.cdr.detectChanges();
    });
  }

  updateAcademicPeriod(event: Event, idAcademicPeriod: any){
    this.router.navigate(['/admin/dashboard/updateAcademicPeriod', idAcademicPeriod]);
  }

  deleteAcademicPeriod(event: Event, idAcademicPeriod: any) {
    this.api.invoke(deleteacademicperiod, { idPeriod: idAcademicPeriod }).then((response: any) => {
      this.academicPeriodList = this.academicPeriodList.filter(period => period.idPeriod !== idAcademicPeriod);
      this.cdr.detectChanges();
    }).catch((error) => {
      console.log("Error el Periodo Academico no de elimino" + error);
    });
  }

  getSeverity(status: string) {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      case 'OUTOFSTOCK':
        return 'danger';
      default: return 'info';
    }
  }
}
