import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { LoginComponent } from './auth/login/login.component';
import { ChatComponent } from './chat/chat.component'; // <-- Add this import
import { AuthGuard } from './auth/auth.guard';



export const routes: Routes = [
    {
        pathMatch: 'full', 
        redirectTo: 'login',
        path: '', 
    },
    { 
        path: 'login', 
        component: LoginComponent
    },
    { 
        path: 'chat', 
        component: ChatComponent,
        canActivate: [AuthGuard]
    },
    { 
        path: 'chat/user/:userId', 
        component: ChatComponent 
    },

];