import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Api } from '../../../api/api';
import { deleteschool, indexschool } from '../../../api/functions';
import { CommonModule } from '@angular/common';
import { enviroments } from '../../../enviroments/envitoments'
import { ActivatedRoute, Router } from '@angular/router';

@Component({
	selector: 'app-school-index',
	standalone: true,
	imports: [CardModule, ButtonModule, CommonModule],
	templateUrl: './school-index.html',
	styleUrl: './school-index.css',
})
export class SchoolIndex implements OnInit{
	public schoolList: any[] = [];
	public idSchool: any;

	constructor(private api: Api, private cdr: ChangeDetectorRef, private route: ActivatedRoute, private router: Router) {}

	ngOnInit(): void {
		this.api.invoke(indexschool).then((response: any) => {	
			const parseResponse = typeof response === 'string' ? JSON.parse(response) : response;
			let tempSchool = parseResponse.data ? parseResponse.data : parseResponse;
			
			this.schoolList = tempSchool.map((school: any) => {
				if (school.urlImageSchool) {
					let correctPath = school.urlImageSchool.replace(/\\/g, '/');
					let baseUrl = enviroments.URL_NORMAL;
					if (!baseUrl.endsWith('/')) {
						baseUrl += '/';
					}

					const buildPath = encodeURI(correctPath);
					school.urlImageSchool = baseUrl + buildPath;
				}
				return school;
			});
			this.cdr.detectChanges();
		}).catch((error) => {
			console.log("Error no se pudieron extraer los datos" + error);
		})
	}

	public delete(idSchool: string) {
		this.api.invoke(deleteschool, { idSchool: idSchool }).then((response: any) => {
			this.schoolList = this.schoolList.filter(school => school.idSchool !== idSchool)
			this.cdr.detectChanges();
		}).catch((error) => {
			console.log("Error la escuela no se elimino " + error);
		}); 
	}

	public navigate(event: Event, idSchool: string){
		this.router.navigate(['admin/dashboard/updateSchool', idSchool]);
	}
}
