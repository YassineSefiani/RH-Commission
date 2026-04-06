package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.Constraint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ConstraintRepository extends JpaRepository<Constraint, Long> {
    List<Constraint> findByActive(Boolean active);
}
