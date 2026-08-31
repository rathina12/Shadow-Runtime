package com.shadowruntime.core.registry;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DependencyRepository extends JpaRepository<ServiceDependency, Long> {
    List<ServiceDependency> findBySourceServiceId(String sourceServiceId);
    List<ServiceDependency> findByTargetServiceId(String targetServiceId);
    boolean existsBySourceServiceIdAndTargetServiceId(String sourceServiceId, String targetServiceId);
}
