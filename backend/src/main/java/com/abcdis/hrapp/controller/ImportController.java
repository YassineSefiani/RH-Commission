package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.*;
import com.abcdis.hrapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class ImportController {

    @Autowired private VolumeDistributionRepository volumeRepo;
    @Autowired private NoteTriageRepository triageRepo;
    @Autowired private ObjectifCommercialRepository objectifRepo;
    @Autowired private RealisationCommercialeRepository realisationRepo;

    @PostMapping("/volumes")
    public ResponseEntity<VolumeDistribution> importVolume(@RequestBody VolumeDistribution vol) {
        return ResponseEntity.ok(volumeRepo.save(vol));
    }

    @PostMapping("/volumes/batch")
    public ResponseEntity<List<VolumeDistribution>> importVolumesBatch(@RequestBody List<VolumeDistribution> vols) {
        return ResponseEntity.ok(volumeRepo.saveAll(vols));
    }

    @GetMapping("/volumes")
    public List<VolumeDistribution> getVolumes() { return volumeRepo.findAll(); }

    @PostMapping("/triage")
    public ResponseEntity<NoteTriage> importTriage(@RequestBody NoteTriage triage) {
        return ResponseEntity.ok(triageRepo.save(triage));
    }

    @PostMapping("/triage/batch")
    public ResponseEntity<List<NoteTriage>> importTriageBatch(@RequestBody List<NoteTriage> triages) {
        return ResponseEntity.ok(triageRepo.saveAll(triages));
    }

    @GetMapping("/triage")
    public List<NoteTriage> getTriage() { return triageRepo.findAll(); }

    @PostMapping("/objectifs")
    public ResponseEntity<ObjectifCommercial> importObjectif(@RequestBody ObjectifCommercial obj) {
        return ResponseEntity.ok(objectifRepo.save(obj));
    }

    @PostMapping("/objectifs/batch")
    public ResponseEntity<List<ObjectifCommercial>> importObjectifsBatch(@RequestBody List<ObjectifCommercial> objs) {
        return ResponseEntity.ok(objectifRepo.saveAll(objs));
    }

    @GetMapping("/objectifs")
    public List<ObjectifCommercial> getObjectifs() { return objectifRepo.findAll(); }

    @PostMapping("/realisations")
    public ResponseEntity<RealisationCommerciale> importRealisation(@RequestBody RealisationCommerciale real) {
        return ResponseEntity.ok(realisationRepo.save(real));
    }

    @PostMapping("/realisations/batch")
    public ResponseEntity<List<RealisationCommerciale>> importRealisationsBatch(@RequestBody List<RealisationCommerciale> reals) {
        return ResponseEntity.ok(realisationRepo.saveAll(reals));
    }

    @GetMapping("/realisations")
    public List<RealisationCommerciale> getRealisations() { return realisationRepo.findAll(); }
}
