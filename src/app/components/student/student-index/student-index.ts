import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Api } from '../../../api/api';
import { deletestudent, indexstudent } from '../../../api/functions';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { first } from 'rxjs';
import { DialogModule } from 'primeng/dialog';

interface Column {
  field: string;
  header: string;
}

@Component({
  selector: 'app-student-index',
  imports: [ TableModule, TagModule, FormsModule, Button, DialogModule ],
  standalone: true,
  templateUrl: './student-index.html',
  styleUrl: './student-index.css',
})

export class StudentIndex implements OnInit{
  listStudent: any[] = [];
  cols!: Column[];

  displayModal = false;
  selectedStudent: any = null;

  constructor(private api: Api, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cols = [
      { field: 'firstName', header: 'Nombres' },
      { field: 'surName', header: 'Apellidos' },
      { field: 'code', header: 'Codigo' },
      { field: 'nameSchool', header: 'Escuela Academica' },
      { field: 'status', header: 'Estado' },
      { field: 'details', header: 'Detalles' },
      { field: 'update', header: 'Actualizar' },
      {field: 'delete', header: 'Eliminar'}
    ];

    this.api.invoke(indexstudent).then((response: any) => {
      let apiResponseTemp = typeof response === 'string' ? JSON.parse(response) : response;
      let apiResponse = apiResponseTemp.data ? apiResponseTemp.data : apiResponseTemp;
      this.listStudent = apiResponse.map((student: any) => {
        return {
          ...student,
          firstName: student.parentUser ? student.parentUser.firstName : 'N/A',
          surName: student.parentUser ? student.parentUser.surName : 'N/A',
          nameSchool: student.parentSchool ? student.parentSchool.nameSchool : 'N/A'
        }
      });
      this.cdr.detectChanges();
      console.log(this.listStudent);
    });
  }

  showDetail(student: any): void {
    this.selectedStudent = student;
    this.displayModal = true;
  }

  updateStudent(event: Event, idStudent: string) {}

  deleteStudent(event: Event, idStudent: string) {
    this.api.invoke(deletestudent, { idStudent }).then((response: any) => {
      let apiResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.cdr.detectChanges();
    });
  }

  getSeverity(status: string) {
    if (!status) return 'info';
    const s = status.toLowerCase();
    if (s === 'activo') return 'success';
    if (s === 'inactivo') return 'danger';
    return 'info';
  }
}
