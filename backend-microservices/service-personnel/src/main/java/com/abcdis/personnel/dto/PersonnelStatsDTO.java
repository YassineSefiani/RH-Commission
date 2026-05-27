package com.abcdis.personnel.dto;

/** Statistiques globales du personnel — retourné par GET /api/personnel/stats */
public record PersonnelStatsDTO(long total, long actifs, long inactifs) {}
