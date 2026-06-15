import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Header } from '../header/header'; // Reutilizamos tu Header
import { ClienteService } from '../../services/cliente';
import { Cliente } from '../../models/cliente';

@Component({
  selector: 'app-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Header],
  templateUrl: './cliente.html',
  styleUrl: './cliente.css'
})
export class ClienteComponent implements OnInit {

  // Listas de datos
  clientes: Cliente[] = [];
  
  // Control de Formularios y Modales
  form: FormGroup;
  showModal = false;
  isEditMode = false;
  clienteIdSeleccionado: number | null = null;

  // Estados de carga y búsqueda
  buscando = false;
  mensajeError = '';

  // Inyecciones modernas usando inject()
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private clienteService = inject(ClienteService);

  constructor() {
    // Inicializamos el formulario con validaciones reactivas idénticas a tus DTOs de Java
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern("^[0-9]{8}$")]], // DNI peruano de 8 dígitos
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern("^[0-9]{9}$")]], // Celular de 9 dígitos
      direccion: ['']
    });
  }

  ngOnInit(): void {
    this.listarClientes();
  }

  // ============================================
  // LEER / LISTAR CLIENTES
  // ============================================
  listarClientes(): void {
    this.buscando = true;
    this.clienteService.listar().subscribe({
      next: (data) => {
        this.clientes = data;
        this.buscando = false;
      },
      error: (err) => {
        console.error('Error al listar clientes:', err);
        this.mensajeError = 'No se pudo conectar con el microservicio de clientes.';
        this.buscando = false;
      }
    });
  }

  // ============================================
  // BUSCAR POR DNI
  // ============================================
  buscarPorDni(event: any): void {
    const dni = event.target.value;
    if (dni.length === 8) {
      this.clienteService.buscarPorDni(dni).subscribe({
        next: (cliente) => {
          if (cliente) {
            // Si encuentra un cliente con ese DNI, lo mapeamos directamente para editarlo
            this.abrirModalEditar(cliente);
          }
        },
        error: () => console.log('DNI libre para registro')
      });
    }
  }

  // ============================================
  // GUARDAR (CREAR O ACTUALIZAR)
  // ============================================
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const clienteData: Cliente = this.form.value;

    if (this.isEditMode && this.clienteIdSeleccionado !== null) {
      // Modo Edición -> @PutMapping
      this.clienteService.actualizar(this.clienteIdSeleccionado, clienteData).subscribe({
        next: () => {
          alert('Cliente actualizado con éxito');
          this.cerrarModal();
          this.listarClientes();
        },
        error: (err) => alert('Error al actualizar cliente')
      });
    } else {
      // Modo Creación -> @PostMapping
      this.clienteService.crear(clienteData).subscribe({
        next: () => {
          alert('Cliente registrado con éxito');
          this.cerrarModal();
          this.listarClientes();
        },
        error: (err) => alert('Error al registrar cliente')
      });
    }
  }

  // ============================================
  // ELIMINAR CLIENTE
  // ============================================
  eliminar(id?: number): void {
    if (!id) return;
    
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clienteService.eliminar(id).subscribe({
        next: () => {
          alert('Cliente eliminado correctamente');
          this.listarClientes();
        },
        error: (err) => alert('Error al eliminar cliente')
      });
    }
  }

  // ============================================
  // GESTIÓN DE MODALES
  // ============================================
  abrirModalCrear(): void {
    this.isEditMode = false;
    this.clienteIdSeleccionado = null;
    this.form.reset();
    this.showModal = true;
  }

  abrirModalEditar(cliente: Cliente): void {
    this.isEditMode = true;
    this.clienteIdSeleccionado = cliente.id ?? null;
    this.form.patchValue(cliente); // Setea todos los campos automáticamente
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.form.reset();
  }

  onAtras(): void {
    this.router.navigateByUrl('/');
  }
}