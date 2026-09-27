package com.clinica.dto.doctor;

import java.math.BigDecimal;
import java.util.List;

public record DoctorResponse(
        Long id, String name, int age, String contact,
        BigDecimal salary,
        List<ScheduleBlock> schedules) {

    public record ScheduleBlock(Long id, String dayOfWeek, String startTime, String endTime) {
    }
}
