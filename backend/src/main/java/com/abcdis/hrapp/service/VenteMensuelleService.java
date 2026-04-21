package com.abcdis.hrapp.service;

import com.abcdis.hrapp.model.VenteMensuelle;
import com.abcdis.hrapp.repository.VenteMensuelleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class VenteMensuelleService {

    @Autowired
    private VenteMensuelleRepository repository;

    // Récupérer toutes les ventes mensuelles
    public List<VenteMensuelle> getAllVentes() {
        return repository.findAllByOrderByDateDesc();
    }

    // Récupérer une vente par ID
    public Optional<VenteMensuelle> getVenteById(Long id) {
        return repository.findById(id);
    }

    // Récupérer une vente par date
    public Optional<VenteMensuelle> getVenteByDate(LocalDate date) {
        return repository.findByDate(date);
    }

    // Récupérer les ventes entre deux dates
    public List<VenteMensuelle> getVentesByDateRange(LocalDate startDate, LocalDate endDate) {
        return repository.findByDateBetween(startDate, endDate);
    }

    // Créer une nouvelle vente
    public VenteMensuelle createVente(VenteMensuelle vente) {
        return repository.save(vente);
    }

    // Mettre à jour une vente
    public VenteMensuelle updateVente(Long id, VenteMensuelle venteDetails) {
        VenteMensuelle vente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vente not found with id: " + id));
        
        if (venteDetails.getDate() != null) vente.setDate(venteDetails.getDate());
        if (venteDetails.getVolumeCharge() != null) vente.setVolumeCharge(venteDetails.getVolumeCharge());
        if (venteDetails.getVolumeRetourne() != null) vente.setVolumeRetourne(venteDetails.getVolumeRetourne());
        
        return repository.save(vente);
    }

    // Supprimer une vente
    public void deleteVente(Long id) {
        VenteMensuelle vente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vente not found with id: " + id));
        repository.delete(vente);
    }

    // Supprimer toutes les ventes
    public void deleteAllVentes() {
        repository.deleteAll();
    }
}
