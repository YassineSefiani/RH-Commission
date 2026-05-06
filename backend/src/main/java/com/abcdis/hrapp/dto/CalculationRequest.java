package com.abcdis.hrapp.dto;
import lombok.Data;
import java.util.List;

@Data
public class CalculationRequest {
    private String carte;
    private String periode;
    private List<Object> contraintes;
}
