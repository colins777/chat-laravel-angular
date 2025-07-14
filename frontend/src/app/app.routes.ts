import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { ChatComponent } from './chat/chat.component';
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
    { 
        path: 'chat/message-store/:receiverId', 
        component: ChatComponent 
    }

];