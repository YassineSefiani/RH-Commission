package com.abcdis.commission.service;

import com.abcdis.commission.dto.NotificationRequest;
import com.abcdis.commission.model.Notification;
import com.abcdis.commission.repository.HistoriqueCalculRepository;
import com.abcdis.commission.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final HistoriqueCalculRepository historiqueCalculRepository;

    /**
     * Ne crée une notification que s'il existe déjà un calcul pour cet
     * employé sur cette période — pas de bruit si l'ADV n'a rien à revoir.
     */
    public void creerSiCalculExistant(NotificationRequest request) {
        boolean calculExiste = historiqueCalculRepository
                .existsByMatriculeAndMoisAndAnnee(request.getMatricule(), request.getMois(), request.getAnnee());
        if (!calculExiste) {
            return;
        }
        notificationRepository.save(Notification.builder()
                .matricule(request.getMatricule())
                .mois(request.getMois())
                .annee(request.getAnnee())
                .message(request.getMessage())
                .lue(false)
                .build());
    }

    public List<Notification> lister() {
        return notificationRepository.findAllByOrderByDateCreationDesc();
    }

    public void marquerLue(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setLue(true);
            notificationRepository.save(n);
        });
    }
}
