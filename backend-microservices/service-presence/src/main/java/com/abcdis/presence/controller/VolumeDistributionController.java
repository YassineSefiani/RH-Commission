package com.abcdis.presence.controller;

import com.abcdis.presence.model.VolumeDistribution;
import com.abcdis.presence.service.VolumeDistributionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API pour les volumes de distribution par livreur/période.
 * Exposé sur /api/volumes/** (routé via la gateway).
 */
@RestController
@RequestMapping("/api/volumes")
@RequiredArgsConstructor
public class VolumeDistributionController {

    private final VolumeDistributionService volumeService;

    @GetMapping
    public ResponseEntity<List<VolumeDistribution>> listerTous() {
        return ResponseEntity.ok(volumeService.listerTous());
    }

    @GetMapping("/periode/{periode}")
    public ResponseEntity<List<VolumeDistribution>> listerParPeriode(@PathVariable String periode) {
        return ResponseEntity.ok(volumeService.listerParPeriode(periode));
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<List<VolumeDistribution>> listerParMatricule(@PathVariable String matricule) {
        return ResponseEntity.ok(volumeService.listerParMatricule(matricule));
    }

    @PostMapping
    public ResponseEntity<VolumeDistribution> enregistrer(@RequestBody VolumeDistribution volume) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volumeService.enregistrer(volume));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<VolumeDistribution>> enregistrerBatch(@RequestBody List<VolumeDistribution> volumes) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volumeService.enregistrerBatch(volumes));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        volumeService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
