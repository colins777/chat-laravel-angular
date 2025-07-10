import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import { HttpTokenService } from '../../services/http-token.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  error: string | null = null;

  constructor(
    private svc:HttpTokenService,
    private router: Router,
    private fb: FormBuilder, 
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: [''],
      password: ['']
    });
  }

  onSubmit() {
    console.log('Form', this.loginForm.value)

    let {email, password} = this.loginForm.value;
    this.svc.login(email, password)
    .subscribe({
      next: res => this.router.navigate(['/chat']),
      error: err => {
        this.error = err.error.message || 'An error occurred during login';
        console.error('Login error:', err);
      }
    })
  }
}
