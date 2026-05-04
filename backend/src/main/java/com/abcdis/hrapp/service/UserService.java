package com.abcdis.hrapp.service;

import com.abcdis.hrapp.model.User;
import com.abcdis.hrapp.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    public List<User> getAllUsers() {
        return repository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return repository.findById(id);
    }

    public Optional<User> getUserByEmail(String email) {
        return repository.findByEmail(email);
    }

    public User createUser(User user) {
        // Encoder le mot de passe
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return repository.save(user);
    }

    public User updateUser(Long id, User details) {
        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setNom(details.getNom());
        user.setPrenom(details.getPrenom());
        user.setSuperRole(details.getSuperRole());
        user.setActif(details.getActif());
        
        // Mettre à jour le mot de passe seulement s'il est fourni
        if (details.getPassword() != null && !details.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(details.getPassword()));
        }
        
        return repository.save(user);
    }

    public void deleteUser(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        repository.delete(user);
    }

    public String authenticate(String email, String password) {
        Optional<User> userOpt = repository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }
        
        User user = userOpt.get();
        
        if (!user.getActif()) {
            throw new RuntimeException("Compte désactivé");
        }
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }
        
        return generateToken(user);
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

        return Jwts.builder()
                .subject(user.getEmail())      // On retire le "set"
                .claim("superRole", user.getSuperRole())
                .claim("userId", user.getId())
                .issuedAt(now)                 // On retire le "set"
                .expiration(expiryDate)        // On retire le "set"
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            Jwts.parser()                      // Utilise parser() directement
                    .verifyWith(key)           // Utilise verifyWith()
                    .build()
                    .parseSignedClaims(token); // Utilise parseSignedClaims()
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Optional<User> getUserFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            String email = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()              // getPayload() remplace getBody()
                    .getSubject();
            return repository.findByEmail(email);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}