# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
ng serve          # Dev server at http://localhost:4200
ng build          # Production build → dist/
ng test           # Unit tests with Karma/Jasmine
ng generate component nombre-componente   # Scaffold new component
```

## Backend reference

The Spring Boot backend lives at `C:\Users\xj109\OneDrive\Documentos\GitHub\Proyecto_sistema_inventario_2`. Read it for context (endpoint contracts, field names, validation rules) when needed. **Never modify files there.**

## Architecture

**Stack:** Angular 20 (standalone components, signals-ready), TypeScript strict, CSS puro, Bootstrap 5.

**Microservices backend** — each feature maps to its own Spring Boot service on a distinct port, defined in `src/app/config/api.config.ts`:

| Service       | Port |
|---------------|------|
| accesorios    | 8081 |
| categorias    | 8082 |
| clientes      | 8083 |
| estado        | 8084 |
| herramientas  | 8085 |
| melamine      | 8086 |
| proveedores   | 8092 |
| proyectos     | 8089 |
| auth          | 8090 |

Always import from `API` constant (`src/app/config/api.config.ts`) — never hardcode URLs.

**Auth flow:**
- JWT stored in `localStorage` under keys: `token_inventario`, `rol_usuario`, `username`.
- Two roles: `ADMIN` and `USER` (displayed as "Administrador" / "Almacenero").
- `adminGuard` (`src/app/guards/admin.guard.ts`) protects `/proyectos` and `/usuarios`.
- Login supports separate admin and user endpoints (`/login/admin`, `/login/user`).
- Lockout logic (failed attempts countdown) lives in `src/app/utils/auth-lockout.util.ts`.

**Component pattern:** All components are standalone. Use `inject()` (not constructor injection). Each CRUD component follows the same structure: list + filter state, modal for create/edit, `FormGroup` via `FormBuilder`, error string displayed inline.

**Image handling:** Images are not persisted to the backend. They are stored as base64 in `localStorage` via `src/app/utils/image-cache.util.ts` (`cacheEntityImage` / `mergeEntityImages`). Call `mergeEntityImages('entity-name', apiData)` after every list fetch.

**Shared utilities:**
- `src/app/utils/http-error.util.ts` — `httpErrorMessage(err, fallback)`: extract readable message from `HttpErrorResponse`.
- `src/app/utils/form-validation.util.ts` — `formValidationMessage(form)`: first invalid control message.
- `src/app/utils/auth-lockout.util.ts` — lockout state management per role.
- `src/app/utils/file-maps.util.ts` — `pickImageFromInput(event)`: async file→base64 helper (lazy-imported).
- `src/app/utils/username.util.ts` — display name helpers.

**CatalogoService** (`src/app/services/catalogo.ts`): fetches `estados` and `categorias` from their respective microservices; if the list is empty on first load it auto-seeds default values (`Bueno/Regular/Malo`, `Herramientas/Melamine/Accesorios`).
