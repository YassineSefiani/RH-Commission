package com.abcdis.commission.controller;

import com.abcdis.commission.dto.NotificationRequest;
import com.abcdis.commission.model.Notification;
import com.abcdis.commission.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Void> creer(@RequestBody NotificationRequest request) {
        notificationService.creerSiCalculExistant(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping
    public ResponseEntity<List<Notification>> lister() {
        return ResponseEntity.ok(notificationService.lister());
    }

    @PatchMapping("/{id}/lue")
    public ResponseEntity<Void> marquerLue(@PathVariable Long id) {
        notificationService.marquerLue(id);
        return ResponseEntity.ok().build();
    }
}
