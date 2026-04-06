package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.CalculationHistory;
import com.abcdis.hrapp.service.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "http://localhost:5173")
public class HistoryController {

    @Autowired
    private HistoryService service;

    @GetMapping
    public List<CalculationHistory> getAll() {
        return service.getAllHistory();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CalculationHistory> getById(@PathVariable Long id) {
        return service.getHistoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public CalculationHistory create(@RequestBody CalculationHistory history) {
        return service.createHistory(history);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteHistory(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping
    public ResponseEntity<?> clear() {
        service.clearHistory();
        return ResponseEntity.ok().build();
    }
}