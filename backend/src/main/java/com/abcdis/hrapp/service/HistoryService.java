package com.abcdis.hrapp.service;

import com.abcdis.hrapp.model.CalculationHistory;
import com.abcdis.hrapp.repository.HistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class HistoryService {

    @Autowired
    private HistoryRepository repository;

    // Récupérer tout l'historique (trié par date décroissante)
    public List<CalculationHistory> getAllHistory() {
        return repository.findAllByOrderByDateDesc();
    }

    // Récupérer un historique par ID
    public Optional<CalculationHistory> getHistoryById(Long id) {
        return repository.findById(id);
    }

    // Créer un nouvel historique avec date automatique
    public CalculationHistory createHistory(CalculationHistory history) {
        history.setDate(LocalDateTime.now());
        return repository.save(history);
    }

    // Supprimer un historique par ID
    public void deleteHistory(Long id) {
        CalculationHistory history = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("History not found"));
        repository.delete(history);
    }

    // Supprimer tout l'historique
    public void clearHistory() {
        repository.deleteAll();
    }
}