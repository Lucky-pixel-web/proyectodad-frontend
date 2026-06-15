import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms'; // 🎯 Importamos ReactiveFormsModule
import { CommonModule } from '@angular/common'; // 🎯 Importamos CommonModule para ngClass y *ngIf
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true, // 🎯 1. Volvemos el componente independiente
  imports: [
    CommonModule,       // 🎯 2. Registramos CommonModule aquí mismo (arregla ngClass y *ngIf)
    ReactiveFormsModule // 🎯 3. Registramos ReactiveFormsModule aquí mismo (arregla formGroup)
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  cargando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.cargando = false;
        console.log('Bienvenido:', res.username, 'con rol:', res.rol);
        this.router.navigate(['/home']); 
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = 'Credenciales inválidas. Verifica tu usuario o contraseña.';
        console.error(err);
      }
    });
  }
}