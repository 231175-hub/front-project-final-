import { ChangeDetectorRef, Component, OnInit, inject, ViewChild } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Api } from '../../../api/api';
import { deleteschool, indexschool, registerschool, Registerschool$Params, updateschool } from '../../../api/functions';
import { CommonModule } from '@angular/common';
import { enviroments } from '../../../enviroments/envitoments'
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { HttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { confirmAction } from '../../../core/utils/confirm.helper';
import { PrimeNG } from 'primeng/config';

@Component({
	selector: 'app-school-index',
	standalone: true,
	imports: [
		CardModule, 
		ButtonModule, 
		CommonModule, 
		DialogModule, 
		FileUploadModule, 
		TableModule, 
		ToastModule, 
		TooltipModule,
		ReactiveFormsModule,
		InputTextModule,
		ProgressBarModule,
		BadgeModule,
		ConfirmDialogModule
	],
	providers: [MessageService, ConfirmationService],
	templateUrl: './school-index.html',
	styleUrl: './school-index.css',
})
export class SchoolIndex implements OnInit {
	public schoolList: any[] = [];
	public idSchool: any;

	// File Upload Dialog control properties
	displayUploadDialog: boolean = false;
	displayRegisterDialog: boolean = false;
	selectedSchool: any = null;
	selectedFile: File | null = null;
	uploadLoading: boolean = false;
	filesLoading: boolean = false;
	uploadedFilesList: any[] = [];

	// Edit / Register state
	isEditing: boolean = false;
	selectedSchoolId: string | null = null;

	frmInsertSchool!: FormGroup;
	files: File[] = [];
	totalSize: number = 0;
	totalSizePercent: number = 0;

	@ViewChild('imageUpload') fileUploadComponent!: FileUpload;

	private http = inject(HttpClient);
	private messageService = inject(MessageService);
	private confirmationService = inject(ConfirmationService);
	private config = inject(PrimeNG);
	private formBuilder = inject(FormBuilder);

	get nameSchoolfb() { return this.frmInsertSchool.controls['nameSchool']; }
	get imageSchoolfb() { return this.frmInsertSchool.controls['imageSchool']; }

	constructor(private api: Api, private cdr: ChangeDetectorRef, private route: ActivatedRoute, private router: Router) {}

	ngOnInit(): void {
		this.frmInsertSchool = this.formBuilder.group({
			'nameSchool': ['', [Validators.required]],
			'imageSchool': [null, Validators.required]
		});
		this.loadSchools();
	}

	loadSchools(): void {
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
		});
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
		event.stopPropagation(); // Prevent card navigation
		this.router.navigate(['admin/dashboard/updateSchool', idSchool]);
	}

	public viewCourses(idSchool: string) {
		this.router.navigate(['admin/dashboard/schoolCourses', idSchool]);
	}

	// School File Upload methods
	openUploadDialog(event: Event, school: any): void {
		event.stopPropagation(); // Prevent navigating to courses on card click
		this.selectedSchool = school;
		this.displayUploadDialog = true;
		this.clearSelectedFile();
		this.loadUploadedFiles(school.idSchool);
	}

	loadUploadedFiles(idSchool: string): void {
		this.filesLoading = true;
		this.http.get(`${this.api.rootUrl}/indexschoolfile/${idSchool}`).subscribe({
			next: (files: any) => {
				this.uploadedFilesList = files;
				this.filesLoading = false;
				this.cdr.detectChanges();
			},
			error: (err) => {
				console.error('Error loading school files:', err);
				this.filesLoading = false;
				this.cdr.detectChanges();
			}
		});
	}

	onFileSelect(event: any): void {
		if (event.files && event.files.length > 0) {
			this.selectedFile = event.files[0];
			this.cdr.detectChanges();
		}
	}

	clearSelectedFile(): void {
		this.selectedFile = null;
		this.cdr.detectChanges();
	}



	getCleanFileName(name: string): string {
		if (name && name.includes('_')) {
			return name.substring(name.indexOf('_') + 1);
		}
		return name;
	}

	uploadSchoolFile(): void {
		if (!this.selectedFile || !this.selectedSchool) return;

		this.uploadLoading = true;
		const formData = new FormData();
		formData.append('idSchool', this.selectedSchool.idSchool);
		formData.append('files', this.selectedFile);

		this.http.post(`${this.api.rootUrl}/registerschoolfile`, formData).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Éxito',
					detail: 'Documento subido correctamente.',
					life: 2000
				});
				this.clearSelectedFile();
				this.uploadLoading = false;
				this.loadUploadedFiles(this.selectedSchool.idSchool);
			},
			error: (err) => {
				console.error('Error uploading file:', err);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Ocurrió un error al subir el archivo.',
					life: 2000
				});
				this.uploadLoading = false;
				this.cdr.detectChanges();
			}
		});
	}

	previewFile(file: any): void {
		if (!this.selectedSchool) return;
		const baseUrl = enviroments.URL_NORMAL.endsWith('/') ? enviroments.URL_NORMAL : `${enviroments.URL_NORMAL}/`;
		const fileUrl = `${baseUrl}storage/schoolFile/${encodeURIComponent(this.selectedSchool.nameSchool)}/${encodeURIComponent(file.name)}`;
		window.open(fileUrl, '_blank');
	}

	deleteFile(file: any): void {
		this.http.delete(`${this.api.rootUrl}/deleteschoolfile/${file.idSchoolFile}`).subscribe({
			next: () => {
				this.messageService.add({
					severity: 'success',
					summary: 'Éxito',
					detail: 'Archivo eliminado correctamente.',
					life: 2000
				});
				this.loadUploadedFiles(this.selectedSchool.idSchool);
			},
			error: (err) => {
				console.error('Error deleting file:', err);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Ocurrió un error al eliminar el archivo.',
					life: 2000
				});
			}
		});
	}

	openRegisterDialog(): void {
		this.isEditing = false;
		this.selectedSchoolId = null;
		this.frmInsertSchool.reset();
		this.frmInsertSchool.get('imageSchool')?.setValue(null);
		
		// Make image required for registration
		this.frmInsertSchool.get('imageSchool')?.setValidators([Validators.required]);
		this.frmInsertSchool.get('imageSchool')?.updateValueAndValidity();

		if (this.fileUploadComponent) {
			this.fileUploadComponent.clear();
		}
		this.files = [];
		this.totalSize = 0;
		this.totalSizePercent = 0;
		this.displayRegisterDialog = true;
		this.cdr.detectChanges();
	}

	openEditDialog(school: any): void {
		this.isEditing = true;
		this.selectedSchoolId = school.idSchool;
		this.frmInsertSchool.reset();
		
		this.frmInsertSchool.patchValue({
			nameSchool: school.nameSchool,
			imageSchool: null
		});

		// Image is NOT required when editing
		this.frmInsertSchool.get('imageSchool')?.clearValidators();
		this.frmInsertSchool.get('imageSchool')?.updateValueAndValidity();

		if (this.fileUploadComponent) {
			this.fileUploadComponent.clear();
		}
		this.files = [];
		this.totalSize = 0;
		this.totalSizePercent = 0;
		this.displayRegisterDialog = true;
		this.cdr.detectChanges();
	}

	sendInsertSchool(event: Event): void {
		if (!this.frmInsertSchool.valid) {
			this.frmInsertSchool.markAllAsTouched();
			this.frmInsertSchool.markAllAsDirty();
			this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Complete los datos faltantes. Por favor.' });
			return;
		}

		if (this.isEditing) {
			confirmAction(this.confirmationService, event, '¿Desea actualizar esta escuela?', () => {
				const bodyParams = {
					idSchool: this.selectedSchoolId!,
					body: {
						nameSchool: this.nameSchoolfb.value,
						file: this.imageSchoolfb.value
					}
				};

				this.api.invoke(updateschool, bodyParams).then((response: any) => {
					this.displayRegisterDialog = false;
					this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Escuela actualizada correctamente.', life: 2000 });
					this.loadSchools();
				}).catch((error) => {
					this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salió mal: ' + error });
				});
			});
		} else {
			confirmAction(this.confirmationService, event, '¿Desea ingresar esta escuela?', () => {
				const bodyParams: Registerschool$Params = {
					body: {
						nameSchool: this.nameSchoolfb.value,
						file: this.imageSchoolfb.value
					}
				};

				this.api.invoke(registerschool, bodyParams).then((response: any) => {
					this.displayRegisterDialog = false;
					this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Escuela registrada correctamente.', life: 2000 });
					this.loadSchools();
				}).catch((error) => {
					this.messageService.add({ severity: 'error', summary: 'Exception', detail: 'Ups. Algo salió mal: ' + error });
				});
			});
		}
	}

	choose(event: Event, callback: Function) {
		callback();
	}

	onClearTemplatingUpload(clear: Function) {
		clear();
		this.totalSize = 0;
		this.totalSizePercent = 0;
	}

	onTemplatedUpload() {
		this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded', life: 3000 });
	}

	onSelectedFiles(event: any) {
		this.files = event.currentFiles;
		this.files.forEach((file) => {
			this.totalSize += parseInt(this.formatSize(file.size));
		});
		this.totalSizePercent = this.totalSize / 10;

		this.frmInsertSchool.patchValue({ imageSchool: this.files[0] });
	}

	uploadEvent(callback: Function) {
		callback();
	}

	formatSize(bytes: number) {
		const k = 1024;
		const dm = 3;
		const sizes = this.config.translation.fileSizeTypes;
		if (bytes === 0) {
			return `0 ${sizes![0]}`;
		}
		
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
		
		return `${formattedSize} ${sizes![i]}`;
	}
}
