package com.blockchain.backend.petchainLOGIN.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class PetRegisterRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String species; // dog | cat | rabbit | other

    private String breed;
    private Integer birthYear;
    private String gender;     // male | female | unknown
    private Boolean isNeutered;
}
