import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MegaMenuItem, MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MegaMenuModule } from 'primeng/megamenu';
import { RippleModule } from 'primeng/ripple';
import { BadgeModule } from 'primeng/badge';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

import { HttpClient } from '@angular/common/http';
import { ApiConfiguration } from '../../../api/api-configuration';
import { me } from '../../../api/fn/me/me';
import { InteractiveSliderComponent } from '../interactive-slider/interactive-slider.component';

@Component({
    selector: 'app-main-layout-component',
    imports: [
        AvatarModule, 
        ButtonModule, 
        MegaMenuModule, 
        RippleModule, 
        CommonModule, 
        RouterModule, 
        BadgeModule, 
        PanelMenuModule,
        InteractiveSliderComponent
    ],
    templateUrl: './main-layout-component.html',
    styleUrl: './main-layout-component.css',
    standalone: true
})
export class MainLayoutComponent implements OnInit {

    itemsMega: MegaMenuItem[] | undefined;
    itemsMenu: MenuItem[] = [];
    
    public loggedInUsername = signal<string>('Usuario');
    public profilePicUrl = signal<string>('/default-avatar.png'); 
    public mobileMenuVisible = signal<boolean>(false);
    public sidebarCollapsed = signal<boolean>(false);
    public isDarkMode = signal<boolean>(false);

    public toggleMobileMenu() {
        this.mobileMenuVisible.set(!this.mobileMenuVisible());
    }

    public toggleSidebar() {
        this.sidebarCollapsed.set(!this.sidebarCollapsed());
    }

    public toggleDarkMode() {
        const element = document.querySelector('html');
        if (element) {
            if (element.classList.contains('my-app-dark')) {
                element.classList.remove('my-app-dark');
                this.isDarkMode.set(false);
                localStorage.setItem('dark-mode', 'false');
            } else {
                element.classList.add('my-app-dark');
                this.isDarkMode.set(true);
                localStorage.setItem('dark-mode', 'true');
            }
        }
    }

    public isAdmin = signal<boolean>(false);
    public isProfessor = signal<boolean>(false);
    public isStudent = signal<boolean>(false);

    private http = inject(HttpClient);
    private apiConfig = inject(ApiConfiguration);
    private keycloakService = inject(KeycloakService);
    private router = inject(Router);

    constructor() {
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.mobileMenuVisible.set(false);
            }
        });
    }

    async ngOnInit() {
        const isDark = localStorage.getItem('dark-mode') === 'true';
        if (isDark) {
            document.querySelector('html')?.classList.add('my-app-dark');
            this.isDarkMode.set(true);
        }

        if (await this.keycloakService.isLoggedIn()) {
            try {
                const roles = this.keycloakService.getUserRoles();
                this.isAdmin.set(roles.includes('ADMIN'));
                this.isProfessor.set(roles.includes('PROFESSOR'));
                this.isStudent.set(roles.includes('STUDENT'));

                this.buildNavigationMenus();
                
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
                const profileData: any = respuesta.body;
                
                if (profileData) {
                    this.loggedInUsername.set(profileData.full_name || 'Usuario');

                    if (profileData.url_image) {
                        const timestamp = new Date().getTime();
                        let imageUrl = `${urlDinamica}${profileData.url_image}`;
                        if (imageUrl.includes('/intranet/intranet/')) {
                            imageUrl = imageUrl.replace('/intranet/intranet/', '/intranet/');
                        }
                        imageUrl = `${imageUrl}?t=${timestamp}`;
                        this.downloadProfileImage(imageUrl);
                    }
                }
            },
            error: async (err) => {
                const profile = await this.keycloakService.loadUserProfile();
                this.loggedInUsername.set(profile.firstName || 'Usuario');
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
                this.profilePicUrl.set(URL.createObjectURL(blob));
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

        if (this.isAdmin()) {
            this.itemsMenu.push(
                {
                    label: 'Gestión Institucional',
                    icon: 'pi pi-building',
                    expanded: true,
                    items: [
                        { label: 'Ver Escuelas', icon: 'pi pi-list', routerLink: ['/admin/dashboard/indexSchool'] },
                        { label: 'Ver Periodos Académicos', icon: 'pi pi-calendar', routerLink: ['/admin/dashboard/indexAcademicPeriod'] }
                    ]
                },
                {
                    label: 'Usuarios y Cursos',
                    icon: 'pi pi-users',
                    items: [
                        { label: 'Administradores', icon: 'pi pi-shield', routerLink: ['/admin/dashboard/indexAdmin'] },
                        { label: 'Profesores', icon: 'pi pi-id-card', routerLink: ['/admin/dashboard/indexProfessor'] },
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

        if (this.isProfessor()) {
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

        if (this.isStudent()) {
            this.itemsMenu.push(
                {
                    label: 'Mi Espacio',
                    icon: 'pi pi-user',
                    expanded: true,
                    items: [
                        { label: 'Ver Mis Calificaciones', icon: 'pi pi-percentage', routerLink: ['/student/dashboard/reportCardStudent'] },
                        { label: 'Ver Horarios', icon: 'pi pi-calendar', routerLink: ['/student/dashboard/showSchedule'] },
                        { label: 'Comunicados y Documentos', icon: 'pi pi-bell', routerLink: ['/student/dashboard/schoolAnnouncements'] }
                    ]
                }
            );
        }
    }

    public logout() {
        this.keycloakService.logout(window.location.origin);
    }

    public goToProfile() {
        if (this.isAdmin()) {
            this.router.navigate(['/admin/dashboard/profile']);
        } else if (this.isProfessor()) {
            this.router.navigate(['/professor/dashboard/profile']);
        } else if (this.isStudent()) {
            this.router.navigate(['/student/dashboard/profile']);
        }
    }

    public isDashboardHome(): boolean {
        const url = this.router.url;
        return url === '/student/dashboard' || url === '/professor/dashboard' || url === '/admin/dashboard' || 
               url === '/student/dashboard/' || url === '/professor/dashboard/' || url === '/admin/dashboard/';
    }

    public getRoleIcon(): string {
        if (this.isAdmin()) return 'pi pi-shield';
        if (this.isProfessor()) return 'pi pi-briefcase';
        if (this.isStudent()) return 'pi pi-graduation-cap';
        return 'pi pi-user';
    }

    public getRoleSubtitle(): string {
        if (this.isAdmin()) return 'Portal Admin';
        if (this.isProfessor()) return 'Gestión Docente';
        if (this.isStudent()) return 'Portal Académico';
        return 'Portal';
    }
}