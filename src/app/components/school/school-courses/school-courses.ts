import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Api } from '../../../api/api';
import { searchcourse, showschool } from '../../../api/functions';
import { enviroments } from '../../../enviroments/envitoments';

@Component({
  selector: 'app-school-courses',
  imports: [CommonModule, TableModule, ButtonModule, CardModule],
  standalone: true,
  templateUrl: './school-courses.html',
  styleUrl: './school-courses.css'
})
export class SchoolCoursesComponent implements OnInit {
  idSchool: string | null = null;
  school: any = null;
  coursesList: any[] = [];
  loading: boolean = false;
  public env = enviroments;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.idSchool = this.route.snapshot.paramMap.get('idSchool');
    if (this.idSchool) {
      this.loadSchoolDetails();
      this.loadCourses();
    }
  }

  loadSchoolDetails(): void {
    this.api.invoke(showschool, { idSchool: this.idSchool! }).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.school = parseResponse.data ? parseResponse.data : parseResponse;
      this.cdr.detectChanges();
    }).catch((err) => {
      console.error('Error loading school details:', err);
    });
  }

  loadCourses(): void {
    this.loading = true;
    this.api.invoke(searchcourse, { idSchool: this.idSchool!, query: '' }).then((response: any) => {
      const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
      this.coursesList = parseResponse.data ? parseResponse.data : parseResponse;
      this.loading = false;
      this.cdr.detectChanges();
    }).catch((err) => {
      console.error('Error loading courses:', err);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard/indexSchool']);
  }
}
