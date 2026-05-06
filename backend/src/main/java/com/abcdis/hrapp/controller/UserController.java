package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.User;
import com.abcdis.hrapp.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService service;

    @GetMapping
    public List<User> getAll() {
        return service.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return service.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public User create(@RequestBody User user) {
        return service.createUser(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(
            @PathVariable Long id,
            @RequestBody User user) {
        try {
            return ResponseEntity.ok(service.updateUser(id, user));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteUser(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String email = credentials.get("email");
            String password = credentials.get("password");
            
            String token = service.authenticate(email, password);
            
            return ResponseEntity.ok(Map.of(
                "token", token,
                "type", "Bearer"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        
        if (token == null || token.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("valid", false));
        }
        
        boolean valid = service.validateToken(token);
        
        if (valid) {
            return service.getUserFromToken(token)
                    .map(user -> ResponseEntity.ok(Map.of(
                        "valid", true,
                        "user", Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "superRole", user.getSuperRole(),
                            "nom", user.getNom(),
                            "prenom", user.getPrenom()
                        )
                    )))
                    .orElse(ResponseEntity.status(401).body(Map.of("valid", false)));
        }
        
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}