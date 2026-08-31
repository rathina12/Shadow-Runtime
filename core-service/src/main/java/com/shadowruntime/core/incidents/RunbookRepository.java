package com.shadowruntime.core.incidents;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RunbookRepository extends JpaRepository<Runbook, Long> {
    List<Runbook> findByTargetService(String targetService);

    @Query("SELECT r FROM Runbook r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.symptoms) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(r.rootCauseCategory) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Runbook> searchRunbooks(@Param("query") String query);
}
