package com.abcdis.presence.service;

import com.abcdis.presence.exception.ResourceNotFoundException;
import com.abcdis.presence.model.VolumeDistribution;
import com.abcdis.presence.repository.VolumeDistributionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VolumeDistributionService {

    private final VolumeDistributionRepository volumeRepository;

    @Transactional(readOnly = true)
    public List<VolumeDistribution> listerTous() {
        return volumeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<VolumeDistribution> listerParPeriode(String periode) {
        return volumeRepository.findByPeriode(periode);
    }

    @Transactional(readOnly = true)
    public List<VolumeDistribution> listerParMatricule(String matricule) {
        return volumeRepository.findByMatricule(matricule);
    }

    @Transactional
    public VolumeDistribution enregistrer(VolumeDistribution volume) {
        volumeRepository.findByPeriodeAndMatricule(volume.getPeriode(), volume.getMatricule())
                .ifPresent(existant -> volume.setId(existant.getId()));
        return volumeRepository.save(volume);
    }

    @Transactional
    public List<VolumeDistribution> enregistrerBatch(List<VolumeDistribution> volumes) {
        return volumes.stream().map(this::enregistrer).toList();
    }

    @Transactional
    public void supprimer(Long id) {
        if (!volumeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Volume de distribution introuvable avec l'ID : " + id);
        }
        volumeRepository.deleteById(id);
    }
}
