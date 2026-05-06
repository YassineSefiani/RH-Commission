package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.dto.CalculationRequest;
import com.abcdis.hrapp.dto.CalculationResponse;
import com.abcdis.hrapp.dto.DataCheckResponse;
import com.abcdis.hrapp.service.CalculationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/calculations")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class CalculationController {

    @Autowired
    private CalculationService service;

    @GetMapping("/check/{brand}/{periode}")
    public ResponseEntity<DataCheckResponse> check(
            @PathVariable String brand,
            @PathVariable String periode) {
        return ResponseEntity.ok(service.check(brand, periode));
    }

    @PostMapping
    public ResponseEntity<CalculationResponse> calculate(@RequestBody CalculationRequest request) {
        try {
            return ResponseEntity.ok(service.calculate(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
