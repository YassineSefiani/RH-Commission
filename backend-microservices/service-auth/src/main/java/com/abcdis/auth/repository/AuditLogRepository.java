package com.abcdis.auth.repository;

import com.abcdis.auth.model.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:email IS NULL OR a.userEmail = :email)
              AND (:action IS NULL OR a.action = :action)
            ORDER BY a.timestamp DESC
            """)
    List<AuditLog> rechercher(@Param("email") String email,
                              @Param("action") String action,
                              Pageable pageable);
}
