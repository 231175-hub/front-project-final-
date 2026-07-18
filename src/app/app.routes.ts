import { Routes } from '@angular/router';
import { SchoolInsert } from './components/school/school-insert/school-insert';
import { MainLayoutComponent } from './components/layout/main-layout-component/main-layout-component';
import { authGuard } from './core/guards/auth-guard';
import { RootDispatcherComponent } from './components/Dispatcher/root-dispatcher-component/root-dispatcher-component';
import { SchoolIndex } from './components/school/school-index/school-index';
import { UpdateSchool } from './components/school/update-school/update-school';
import { SchoolCoursesComponent } from './components/school/school-courses/school-courses';
import { AcademicPeriodInsert } from './components/academicPeriod/academic-period-insert/academic-period-insert';
import { AcademicPeriodIndex } from './components/academicPeriod/academic-period-index/academic-period-index';
import { AcademicPeriodUpdate } from './components/academicPeriod/academic-period-update/academic-period-update';
import { AdminInsert } from './components/admin/admin-insert/admin-insert';
import { AdminIndex } from './components/admin/admin-index/admin-index';
import { StudentInsert } from './components/student/student-insert/student-insert';
import { ProfessorInsert } from './components/professor/professor-insert/professor-insert';
import { ProfessorIndex } from './components/professor/professor-index/professor-index';
import { indexstudent, showschedule } from './api/functions';
import { StudentIndex } from './components/student/student-index/student-index';
import { CourseInsert } from './components/course-insert/course-insert';

import { CourseEnrollmentInsert } from './components/courseEnrollment/course-enrollment-insert/course-enrollment-insert';
import { AssignGroups } from './components/courseEnrollment/assign-groups/assign-groups';
import { ScheduleInsert } from './components/schedule/schedule-insert/schedule-insert';
import { GroupsProfessor } from './components/professor/groups-professor/groups-professor';
import { GroupRegisterComponent } from './components/professor/group-register/group-register';
import { ReportCard } from './components/student/report-card/report-card';
import { ScheduleShow } from './components/schedule/schedule-show/schedule-show';
import { ProfileComponent } from './components/profile/profile';
import { SchoolAnnouncementsComponent } from './components/student/school-announcements/school-announcements';
import { NotFoundComponent } from './components/not-found/not-found.component';

export const routes: Routes = [
    { path: '', component:RootDispatcherComponent },
    {
        path: 'admin/dashboard', component: MainLayoutComponent,
        canActivate: [authGuard],
        data: { roles: ['ADMIN'] },
        children: [
            //School
            { path: 'registerSchool', component: SchoolInsert},
            { path: 'indexSchool', component: SchoolIndex },
            { path: 'updateSchool/:idSchool', component: UpdateSchool },
            { path: 'schoolCourses/:idSchool', component: SchoolCoursesComponent },

            //AcademicPeriod
            { path: 'registerAcademicPeriod', component: AcademicPeriodInsert },
            { path: 'indexAcademicPeriod', component: AcademicPeriodIndex },
            { path: 'updateAcademicPeriod/:idAcademicPeriod', component: AcademicPeriodUpdate},

            //Admin
            { path: 'registerAdmin', component: AdminInsert },
            { path: 'indexAdmin', component: AdminIndex },

            //Student
            { path: 'registerStudent', component: StudentInsert },
            { path: 'indexStudent', component: StudentIndex },

            //Professor
            { path: 'registerProfessor', component: ProfessorInsert },
            { path: 'indexProfessor', component: ProfessorIndex },


            //Course
            { path: 'registerCourse', component: CourseInsert },

            //CourseEnrollment
            { path: 'registerCourseEnrollment', component: CourseEnrollmentInsert },
            { path: 'assignGroups', component: AssignGroups },

            //Schedule
            { path:'registerSchedule', component: ScheduleInsert },

            //Profile
            { path: 'profile', component: ProfileComponent }
        ]
    },

    {
        path: 'professor/dashboard', component: MainLayoutComponent,
        canActivate: [authGuard],
        data: { roles: ['PROFESSOR'] },
        children: [
            //GoogleSheet
            { path:'groupProfessor', component:GroupsProfessor },
            { path: 'group-register/:idGroup', component: GroupRegisterComponent },
            
            //Profile
            { path: 'profile', component: ProfileComponent }
        ]
    },

    {
        path: 'student/dashboard', component: MainLayoutComponent,
        canActivate: [authGuard],
        data: { roles: ['STUDENT'] },
        children: [
            //reportCard
            { path:'reportCardStudent', component:ReportCard },

            //schedule
            { path:'showSchedule', component:ScheduleShow },

            //announcements
            { path: 'schoolAnnouncements', component: SchoolAnnouncementsComponent },

            //Profile
            { path: 'profile', component: ProfileComponent }
        ]
    },
    { path: '**', component: NotFoundComponent }
];
