import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MegaMenuItem, MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MegaMenuModule } from 'primeng/megamenu';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RouterModule, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

// TUS NUEVAS IMPORTACIONES
import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../../api/api-configuration';
import { me } from '../../../api/fn/me/me';

@Component({
    selector: 'app-main-layout-component',
    imports: [AvatarModule, ButtonModule, MegaMenuModule, RippleModule, CommonModule, RouterModule, BadgeModule, PanelMenuModule],
    templateUrl: './main-layout-component.html',
    styleUrl: './main-layout-component.css',
    standalone: true
})
export class MainLayoutComponent implements OnInit {

    itemsMega: MegaMenuItem[] | undefined;
    itemsMenu: MenuItem[] = [];
    
    public usernameLogueado: string = 'Usuario';
    public profilePicUrl: string = '/default-avatar.png'; // Imagen por defecto

    public isAdmin: boolean = false;
    public isProfessor: boolean = false;
    public isStudent: boolean = false;

    // INYECCIÓN DE TUS SERVICIOS
    private http = inject(HttpClient);
    private apiConfig = inject(ApiConfiguration);

    constructor(
        private keycloakService: KeycloakService,
        private cdr: ChangeDetectorRef,
        private router: Router
    ) {}

    async ngOnInit() {
        if (await this.keycloakService.isLoggedIn()) {
            try {
                const roles = this.keycloakService.getUserRoles();
                this.isAdmin = roles.includes('ADMIN');
                this.isProfessor = roles.includes('PROFESSOR');
                this.isStudent = roles.includes('STUDENT');

                this.buildNavigationMenus();
                
                // Llamamos a tu función personalizada
                this.loadMyProfile();

            } catch (error) {
                console.error('Error cargando datos de sesión', error);
            }
        }
    }

    private loadMyProfile() {
        const urlDinamica = this.apiConfig.rootUrl;

        me(this.http, urlDinamica).subscribe({
            next: (respuesta) => {
                const profileData = respuesta.body;
                
                if (profileData) {
                    this.usernameLogueado = profileData.full_name || 'Usuario';
                    this.cdr.detectChanges();

                    if (profileData.url_image) {
                        const timestamp = new Date().getTime();
                        let imageUrl = `${urlDinamica}${profileData.url_image}`;
                        if (imageUrl.includes('/intranet/intranet/')) {
                            imageUrl = imageUrl.replace('/intranet/intranet/', '/intranet/');
                        }
                        imageUrl = `${imageUrl}?t=${timestamp}`;
                        this.downloadProfileImage(imageUrl);
                    } else {
                        this.cdr.detectChanges();
                    }
                }
            },
            error: async (err) => {
                console.error('Error al llamar a /me en el layout:', err);
                // Si falla el backend, usamos el nombre de Keycloak por si acaso
                const profile = await this.keycloakService.loadUserProfile();
                this.usernameLogueado = profile.firstName || 'Usuario';
                this.cdr.detectChanges();
            }
        });
    }
    private async downloadProfileImage(imageUrl: string) {
        try {
            const token = await this.keycloakService.getToken();
            const response = await fetch(imageUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                this.profilePicUrl = URL.createObjectURL(blob);
                this.cdr.detectChanges(); // Le avisa a Angular que ya dibujamos la imagen
            }
        } catch (error) {
            console.error('Error al descargar la imagen de perfil:', error);
        }
    }

    private buildNavigationMenus() {
        this.itemsMega = [
            {
                label: 'Sistema Académico',
                root: true,
                items: [
                    [
                        {
                            items: [
                                { label: 'Inicio', icon: 'pi pi-home', routerLink: ['/'] }
                            ]
                        }
                    ]
                ]
            }
        ];

        this.itemsMenu = [];

        if (this.isAdmin) {
            this.itemsMenu.push(
                {
                    label: 'Gestión Institucional',
                    icon: 'pi pi-building',
                    expanded: true,
                    items: [
                        { label: 'Registrar Escuela', icon: 'pi pi-plus', routerLink: ['/admin/dashboard/registerSchool'] },
                        { label: 'Ver Escuelas', icon: 'pi pi-list', routerLink: ['/admin/dashboard/indexSchool'] },
                        { label: 'Periodo Académico', icon: 'pi pi-calendar', routerLink: ['/admin/dashboard/indexAcademicPeriod'] },
                        { label: 'Registrar Semestre', icon: 'pi pi-bookmark', routerLink: ['/admin/dashboard/registerSemester'] }
                    ]
                },
                {
                    label: 'Usuarios y Cursos',
                    icon: 'pi pi-users',
                    items: [
                        { label: 'Registrar Profesor', icon: 'pi pi-user-plus', routerLink: ['/admin/dashboard/registerProfessor'] },
                        { label: 'Registrar Alumno', icon: 'pi pi-user-plus', routerLink: ['/admin/dashboard/registerStudent'] },
                        { label: 'Ver Alumnos', icon: 'pi pi-eye', routerLink: ['/admin/dashboard/indexStudent'] },
                        { label: 'Registrar Curso', icon: 'pi pi-book', routerLink: ['/admin/dashboard/registerCourse'] }
                    ]
                },
                {
                    label: 'Matrículas y Horarios',
                    icon: 'pi pi-file-edit',
                    items: [
                        { label: 'Matricular en Curso', icon: 'pi pi-check-square', routerLink: ['/admin/dashboard/registerCourseEnrollment'] },
                        { label: 'Asignar Grupos', icon: 'pi pi-sitemap', routerLink: ['/admin/dashboard/assignGroups'] },
                        { label: 'Registrar Horario', icon: 'pi pi-clock', routerLink: ['/admin/dashboard/registerSchedule'] }
                    ]
                }
            );
        }

        if (this.isProfessor) {
            this.itemsMenu.push(
                {
                    label: 'Herramientas Docente',
                    icon: 'pi pi-th-large',
                    expanded: true,
                    items: [
                        { label: 'Mis Grupos (Excel)', icon: 'pi pi-file-excel', routerLink: ['/professor/dashboard/groupProfessor'] }
                    ]
                }
            );
        }

        if (this.isStudent) {
            this.itemsMenu.push(
                {
                    label: 'Mi Espacio',
                    icon: 'pi pi-user',
                    expanded: true,
                    items: [
                        { label: 'Ver Mis Calificaciones', icon: 'pi pi-percentage', routerLink: ['/alumno/dashboard/mis-notas'] }
                    ]
                }
            );
        }

        this.cdr.markForCheck();
    }

    public logout() {
        this.keycloakService.logout(window.location.origin);
    }

    public goToProfile() {
        if (this.isAdmin) {
            this.router.navigate(['/admin/dashboard/profile']);
        } else if (this.isProfessor) {
            this.router.navigate(['/professor/dashboard/profile']);
        } else if (this.isStudent) {
            this.router.navigate(['/student/dashboard/profile']);
        }
    }
}