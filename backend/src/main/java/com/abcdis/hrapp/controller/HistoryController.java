package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.CalculationHistory;
import com.abcdis.hrapp.repository.HistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "http://localhost:5173")
public class HistoryController {
    
    @Autowired
    private HistoryRepository historyRepository;
    
    @GetMapping
    public List<CalculationHistory> getAllHistory() {
        return historyRepository.findAllByOrderByDateDesc();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CalculationHistory> getHistoryById(@PathVariable Long id) {
        return historyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public CalculationHistory createHistory(@RequestBody CalculationHistory history) {
        history.setDate(LocalDateTime.now());
        return historyRepository.save(history);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHistory(@PathVariable Long id) {
        return historyRepository.findById(id)
                .map(history -> {
                    historyRepository.delete(history);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping
    public ResponseEntity<?> clearHistory() {
        historyRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}
