package com.abcdis.commission.service;

import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.NoteTriage;
import com.abcdis.commission.repository.NoteTriageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteTriageService {

    private final NoteTriageRepository noteTriageRepository;

    @Transactional(readOnly = true)
    public List<NoteTriage> listerToutes() {
        return noteTriageRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<NoteTriage> listerParPeriode(String periode) {
        return noteTriageRepository.findByPeriode(periode);
    }

    @Transactional
    public NoteTriage enregistrer(NoteTriage note) {
        // Upsert : si la note existe déjà pour ce matricule/période, on met à jour
        noteTriageRepository.findByPeriodeAndMatricule(note.getPeriode(), note.getMatricule())
                .ifPresent(existante -> note.setId(existante.getId()));
        note.setDerniereMaj(java.time.LocalDateTime.now());
        return noteTriageRepository.save(note);
    }

    @Transactional
    public List<NoteTriage> enregistrerBatch(List<NoteTriage> notes) {
        return notes.stream().map(this::enregistrer).toList();
    }

    @Transactional
    public void supprimer(Long id) {
        if (!noteTriageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Note de triage introuvable avec l'ID : " + id);
        }
        noteTriageRepository.deleteById(id);
    }
}
