package com.abcdis.auth.service;

import com.abcdis.auth.dto.AuditCreationRequest;
import com.abcdis.auth.model.AuditLog;
import com.abcdis.auth.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditRepository;

    @Transactional
    public AuditLog enregistrer(AuditCreationRequest request, String ipAddress) {
        AuditLog entry = AuditLog.builder()
                .userEmail(request.userEmail() != null ? request.userEmail() : "anonymous")
                .userRole(request.userRole())
                .action(request.action())
                .entity(request.entity())
                .entityId(request.entityId())
                .details(request.details())
                .ipAddress(ipAddress)
                .build();
        return auditRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> lister(String email, String action, int limit) {
        Pageable page = PageRequest.of(0, Math.min(Math.max(limit, 1), 1000));
        boolean filtered = (email != null && !email.isBlank())
                || (action != null && !action.isBlank());
        if (filtered) {
            return auditRepository.rechercher(
                    blankToNull(email),
                    blankToNull(action),
                    page);
        }
        return auditRepository.findAllByOrderByTimestampDesc(page);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
