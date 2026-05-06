package com.abcdis.hrapp.dto;
import lombok.Data;
import java.util.List;

@Data
public class DataCheckResponse {
    private boolean pret;
    private List<String> donneesManquantes;
}
