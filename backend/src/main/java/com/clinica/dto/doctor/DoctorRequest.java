package com.clinica.dto.doctor;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record DoctorRequest(
        @NotBlank String name,
        @Min(0) int age,
        @NotBlank String contact,
        @NotNull Long specializationId,
        @NotNull @DecimalMin(value = "0.00", message = "Salary cannot be negative") BigDecimal salary,
        @NotEmpty List<ScheduleBlock> schedules) {

    public record ScheduleBlock(String dayOfWeek, String startTime, String endTime) {
    }
}
