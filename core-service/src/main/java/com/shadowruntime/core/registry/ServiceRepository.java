package com.shadowruntime.core.registry;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ServiceRepository extends JpaRepository<MonitoredService, String> {
    List<MonitoredService> findByStatus(String status);
    List<MonitoredService> findByOwnerTeam(String ownerTeam);
}
