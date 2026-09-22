package com.clinica.dto.appointment;

import java.time.LocalTime;
import java.util.List;

public record DoctorAvailability(Long doctorId, String doctorName, List<LocalTime> freeSlots) {
}
