package com.abcdis.auth.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Journal d'audit : trace chaque action utilisateur significative.
 * Persistance dans la base rh_auth, table {@code audit_log}.
 */
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
        @Index(name = "idx_audit_user",      columnList = "user_email"),
        @Index(name = "idx_audit_action",    columnList = "action")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", length = 200)
    private String userEmail;

    @Column(name = "user_role", length = 50)
    private String userRole;

    @Column(name = "action", nullable = false, length = 100)
    private String action;

    @Column(name = "entity", length = 100)
    private String entity;

    @Column(name = "entity_id", length = 100)
    private String entityId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void avantCreation() {
        if (this.timestamp == null) this.timestamp = LocalDateTime.now();
    }
}
