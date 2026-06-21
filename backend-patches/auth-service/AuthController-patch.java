// Agregar en AuthController.java:

import pe.edu.upeu.authservice.dto.UsuarioResponse;
import java.util.List;

@GetMapping("/usuarios")
public ResponseEntity<List<UsuarioResponse>> listarUsuarios() {
    return ResponseEntity.ok(authService.listarUsuarios());
}
