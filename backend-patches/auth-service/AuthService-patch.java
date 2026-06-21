// Agregar/reemplazar en AuthService.java:

import pe.edu.upeu.authservice.dto.UsuarioResponse;
import java.util.List;

public AuthResponse register(AuthRequest request, String rol) {
    if (usuarioRepository.findByUsername(request.getUsername()).isPresent()) {
        throw new RuntimeException("El usuario '" + request.getUsername() + "' ya está registrado.");
    }
    if (request.getDni() != null && usuarioRepository.findByDni(request.getDni()).isPresent()) {
        throw new RuntimeException("El DNI '" + request.getDni() + "' ya está registrado.");
    }
    Usuario usuario = new Usuario();
    usuario.setUsername(request.getUsername());
    usuario.setPassword(passwordEncoder.encode(request.getPassword()));
    usuario.setRol(rol);
    usuario.setNombres(request.getNombres());
    usuario.setApellidos(request.getApellidos());
    usuario.setDni(request.getDni());
    usuarioRepository.save(usuario);
    String token = jwtService.generateToken(usuario.getUsername(), usuario.getRol());
    return new AuthResponse(token, usuario.getUsername(), usuario.getRol());
}

public List<UsuarioResponse> listarUsuarios() {
    return usuarioRepository.findAll().stream()
            .map(u -> new UsuarioResponse(
                    u.getId(), u.getUsername(), u.getNombres(),
                    u.getApellidos(), u.getDni(), u.getRol()))
            .toList();
}
