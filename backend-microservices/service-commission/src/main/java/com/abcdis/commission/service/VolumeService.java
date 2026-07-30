package com.abcdis.commission.service;

import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.Volume;
import com.abcdis.commission.repository.VolumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VolumeService {

    private final VolumeRepository volumeRepository;

    @Transactional(readOnly = true)
    public List<Volume> listerToutes() {
        return volumeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Volume> listerParPeriode(String periode) {
        return volumeRepository.findByPeriode(periode);
    }

    @Transactional
    public Volume enregistrer(Volume volume) {
        volumeRepository.findByDateAndMatricule(volume.getDate(), volume.getMatricule())
                .ifPresent(existant -> volume.setId(existant.getId()));
        return volumeRepository.save(volume);
    }

    @Transactional
    public List<Volume> enregistrerBatch(List<Volume> volumes) {
        return volumes.stream().map(this::enregistrer).toList();
    }

    @Transactional
    public void supprimer(Long id) {
        if (!volumeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Volume introuvable avec l'ID : " + id);
        }
        volumeRepository.deleteById(id);
    }
}
