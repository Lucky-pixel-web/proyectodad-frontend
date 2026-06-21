import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Header } from '../header/header';
import { AuthService } from '../../services/auth-service';
import { generateUsername } from '../../utils/username.util';
import { parseAuthError } from '../../utils/auth-error.util';

interface UsuarioView {
  nombres: string;
  apellidos: string;
  username: string;
  dni?: string;
  rol: string;
  createdAt?: string;
  isCurrent?: boolean;
}

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './usuario.html',
})
export class UsuarioComponent implements OnInit {
  usuarios: UsuarioView[] = [];
  filtrados: UsuarioView[] = [];
  busqueda = '';
  busquedaActiva = false;
  form!: FormGroup;
  showModal = false;
  usernamePreview = '';
  mensaje = '';
  error = '';
  backendError = '';
  cargando = false;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  ngOnInit(): void {
    this.form = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
    this.form.valueChanges.subscribe(() => {
      const { nombres, apellidos } = this.form.value;
      this.usernamePreview = generateUsername(nombres || '', apellidos || '');
    });
    this.cargarUsuarios();
  }

  get totalUsuarios() { return this.usuarios.length; }

  cargarUsuarios(): void {
    this.cargando = true;
    this.backendError = '';
    const currentUser = this.auth.getUsername();

    this.auth.listUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data.map((u) => ({
          nombres: u.nombres || u.username,
          apellidos: u.apellidos || '',
          username: u.username,
          dni: u.dni,
          rol: u.rol,
          isCurrent: u.username === currentUser,
        }));
        this.cargando = false;
        this.filtrar();
      },
      error: (err) => {
        this.cargando = false;
        this.backendError = parseAuthError(err);
        this.cargarUsuariosLocal();
      },
    });
  }

  private cargarUsuariosLocal(): void {
    const current = this.auth.getUsername();
    const rol = this.auth.getRol();
    const list: UsuarioView[] = [];

    if (current) {
      list.push({
        nombres: current,
        apellidos: '',
        username: current,
        rol: rol || 'ADMIN',
        isCurrent: true,
      });
    }

    this.auth.getLocalUsers().forEach((u) => {
      if (!list.find((x) => x.username === u['username'])) {
        list.push({
          nombres: u['nombres'] || u['username'],
          apellidos: u['apellidos'] || '',
          username: u['username'],
          dni: u['dni'],
          rol: u['rol'] || 'USER',
        });
      }
    });

    this.usuarios = list;
    this.filtrar();
  }

  get sinResultadosBusqueda(): boolean {
    return this.busquedaActiva && !this.filtrados.length && this.usuarios.length > 0;
  }

  filtrar(): void {
    this.busquedaActiva = !!this.busqueda.trim();
    const q = this.busqueda.toLowerCase();
    this.filtrados = this.usuarios.filter(
      (u) => !q || u.username.toLowerCase().includes(q) || `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q)
    );
  }

  abrirModal(): void {
    this.form.reset();
    this.usernamePreview = '';
    this.mensaje = '';
    this.error = '';
    this.showModal = true;
  }

  cerrarModal(): void { this.showModal = false; }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { nombres, apellidos, dni, password } = this.form.value;
    const username = generateUsername(nombres, apellidos);
    this.auth.registerUser({ nombres, apellidos, dni, password, username }).subscribe({
      next: () => {
        this.mensaje = `Usuario @${username} creado correctamente.`;
        this.cerrarModal();
        this.cargarUsuarios();
      },
      error: (err) => {
        this.error = parseAuthError(err, 'Error al crear usuario.');
      },
    });
  }

  formatRol(rol: string): string {
    return rol === 'ADMIN' ? 'Administrador' : 'Almacenero';
  }
}
