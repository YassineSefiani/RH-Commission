package com.abcdis.auth.controller;

import com.abcdis.auth.dto.AuditCreationRequest;
import com.abcdis.auth.model.AuditLog;
import com.abcdis.auth.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API REST pour le journal d'audit (traçabilité).
 *  POST /api/audit              → enregistrer une action
 *  GET  /api/audit?limit=200    → lire les 200 dernières actions
 *  GET  /api/audit?email=&action=&limit=  → filtrage
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping
    public ResponseEntity<AuditLog> enregistrer(@RequestBody AuditCreationRequest request,
                                                 HttpServletRequest http) {
        String ip = extractIp(http);
        return ResponseEntity.status(HttpStatus.CREATED).body(auditService.enregistrer(request, ip));
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> lister(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "200") int limit) {
        return ResponseEntity.ok(auditService.lister(email, action, limit));
    }

    private static String extractIp(HttpServletRequest http) {
        String forwarded = http.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return comma > 0 ? forwarded.substring(0, comma).trim() : forwarded.trim();
        }
        String remote = http.getRemoteAddr();
        return remote != null ? remote : "unknown";
    }
}
