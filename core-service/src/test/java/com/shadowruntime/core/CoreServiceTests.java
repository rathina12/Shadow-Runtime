package com.shadowruntime.core;

import com.shadowruntime.core.auth.AuthService;
import com.shadowruntime.core.auth.dto.AuthDto;
import com.shadowruntime.core.cost.CostAttributionService;
import com.shadowruntime.core.cost.dto.CostReportDto;
import com.shadowruntime.core.incidents.IncidentService;
import com.shadowruntime.core.incidents.dto.IncidentDto;
import com.shadowruntime.core.registry.ServiceRegistryService;
import com.shadowruntime.core.registry.dto.ServiceDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CoreServiceTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private ServiceRegistryService serviceRegistryService;

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private CostAttributionService costAttributionService;

    @Test
    void testAuthLoginAndRegister() {
        AuthDto.LoginRequest login = new AuthDto.LoginRequest("admin", "admin123");
        AuthDto.AuthResponse res = authService.login(login);
        assertNotNull(res.getToken());
        assertEquals("admin", res.getUser().getUsername());
    }

    @Test
    void testServiceRegistryTopology() {
        ServiceDto.TopologyResponse topology = serviceRegistryService.getTopology();
        assertNotNull(topology);
        assertFalse(topology.getServices().isEmpty());
        assertFalse(topology.getEdges().isEmpty());
        assertTrue(topology.getServices().stream().anyMatch(s -> s.getId().equals("payment-gateway")));
    }

    @Test
    void testIncidentTrackingAndRunbooks() {
        List<IncidentDto.IncidentResponse> incidents = incidentService.getAllIncidents();
        assertFalse(incidents.isEmpty());
        assertNotNull(incidents.get(0).getMatchedRunbook());

        List<IncidentDto.RunbookResponse> runbooks = incidentService.getAllRunbooks();
        assertFalse(runbooks.isEmpty());
    }

    @Test
    void testCostAttributionCalculation() {
        CostReportDto.SystemCostOverview cost = costAttributionService.calculateSystemCost();
        assertNotNull(cost);
        assertTrue(cost.getTotalEstimatedCostPerHour() > 0);
        assertFalse(cost.getServices().isEmpty());
        assertFalse(cost.getTeams().isEmpty());
    }
}
