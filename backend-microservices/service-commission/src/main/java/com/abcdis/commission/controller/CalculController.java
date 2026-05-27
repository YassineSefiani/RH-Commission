package com.abcdis.commission.controller;

import com.abcdis.commission.dto.CalculRequest;
import com.abcdis.commission.dto.CalculResponse;
import com.abcdis.commission.service.CalculService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calcul")
@RequiredArgsConstructor
public class CalculController {

    private final CalculService calculService;

    @PostMapping("/lancer")
    public ResponseEntity<CalculResponse> lancerCalcul(@Valid @RequestBody CalculRequest request) {
        return ResponseEntity.ok(calculService.calculerCommission(request));
    }

    @PostMapping("/groupe")
    public ResponseEntity<List<CalculResponse>> lancerCalculGroupe(
            @RequestBody List<@Valid CalculRequest> requests) {
        List<CalculResponse> resultats = requests.stream()
                .map(calculService::calculerCommission)
                .toList(); // Java 16+ — remplace .collect(Collectors.toList())
        return ResponseEntity.ok(resultats);
    }
}
