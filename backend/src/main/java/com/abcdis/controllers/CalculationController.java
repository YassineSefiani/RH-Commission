package com.abcdis.controllers;

import com.abcdis.dto.CalculationRequestDTO;
import com.abcdis.dto.CalculationResponseDTO;
import com.abcdis.services.CalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/calculations")
@CrossOrigin(origins = "http://localhost:5173")
public class CalculationController {

    @Autowired
    private CalculationService calculationService;

    @PostMapping
    public ResponseEntity<CalculationResponseDTO> calculate(
            @RequestBody CalculationRequestDTO request) {
        CalculationResponseDTO response = calculationService.calculate(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check/{carte}/{periode}")
    public ResponseEntity<Map<String, Object>> checkData(
            @PathVariable String carte,
            @PathVariable String periode) {
        Map<String, Object> result = calculationService.checkDataAvailability(carte, periode);
        return ResponseEntity.ok(result);
    }
}