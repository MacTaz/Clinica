package com.clinica.dto.doctor;

import com.clinica.dto.specialization.SpecializationDto;
import java.math.BigDecimal;
import java.util.List;

public record DoctorResponse(
        Long id, String name, int age, String contact,
        SpecializationDto specialization, BigDecimal salary,
        List<ScheduleBlock> schedules) {

    public record ScheduleBlock(Long id, String dayOfWeek, String startTime, String endTime) {
    }
}
