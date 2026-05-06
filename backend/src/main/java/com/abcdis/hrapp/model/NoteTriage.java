package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "note_triage")
@Data
public class NoteTriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String periode;

    @Column(nullable = false)
    private String matricule;

    @Column(nullable = false)
    private Double note;
}
