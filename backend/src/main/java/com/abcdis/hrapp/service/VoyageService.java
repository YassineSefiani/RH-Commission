package com.abcdis.hrapp.service;

import com.abcdis.hrapp.model.Voyage;
import com.abcdis.hrapp.repository.VoyageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class VoyageService {

    @Autowired
    private VoyageRepository repository;

    // Récupérer tous les voyages
    public List<Voyage> getAllVoyages() {
        return repository.findAll();
    }

    // Récupérer un voyage par ID
    public Optional<Voyage> getVoyageById(Long id) {
        return repository.findById(id);
    }

    // Récupérer un voyage par numéro de voyage
    public Optional<Voyage> getVoyageByNumeroVoyage(String numeroVoyage) {
        return repository.findByNumeroVoyage(numeroVoyage);
    }

    // Récupérer les voyages d'une date spécifique
    public List<Voyage> getVoyagesByDate(LocalDate date) {
        return repository.findByDate(date);
    }

    // Récupérer les voyages d'un camion
    public List<Voyage> getVoyagesByCamion(String camion) {
        return repository.findByCamion(camion);
    }

    // Récupérer les voyages d'un canal
    public List<Voyage> getVoyagesByCanal(String canal) {
        return repository.findByCanal(canal);
    }

    // Récupérer les voyages d'un livreur
    public List<Voyage> getVoyagesByLivreur(String livreur) {
        return repository.findByLivreur(livreur);
    }

    // Récupérer les voyages entre deux dates
    public List<Voyage> getVoyagesByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByDateBetween(startDate, endDate);
    }

    // Créer un nouveau voyage
    public Voyage createVoyage(Voyage voyage) {
        return repository.save(voyage);
    }

    // Mettre à jour un voyage
    public Voyage updateVoyage(Long id, Voyage voyageDetails) {
        Voyage voyage = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voyage not found with id: " + id));
        
        if (voyageDetails.getDate() != null) voyage.setDate(voyageDetails.getDate());
        if (voyageDetails.getCamion() != null) voyage.setCamion(voyageDetails.getCamion());
        if (voyageDetails.getCanal() != null) voyage.setCanal(voyageDetails.getCanal());
        if (voyageDetails.getNumeroVoyage() != null) voyage.setNumeroVoyage(voyageDetails.getNumeroVoyage());
        if (voyageDetails.getLivreur() != null) voyage.setLivreur(voyageDetails.getLivreur());
        if (voyageDetails.getAideLivreur1() != null) voyage.setAideLivreur1(voyageDetails.getAideLivreur1());
        if (voyageDetails.getAideLivreur2() != null) voyage.setAideLivreur2(voyageDetails.getAideLivreur2());
        
        return repository.save(voyage);
    }

    // Supprimer un voyage
    public void deleteVoyage(Long id) {
        Voyage voyage = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voyage not found with id: " + id));
        repository.delete(voyage);
    }

    // Supprimer tous les voyages
    public void deleteAllVoyages() {
        repository.deleteAll();
    }
}
