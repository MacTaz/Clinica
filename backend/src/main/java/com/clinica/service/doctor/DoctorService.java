package com.clinica.service.doctor;

import com.clinica.dto.doctor.DoctorRequest;
import com.clinica.dto.doctor.DoctorResponse;
import com.clinica.repository.doctor.DoctorRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public DoctorResponse registerDoctor(DoctorRequest request) {
        // TODO(Arthur): validate age/salary, look up Specialization by id
        // (404 if missing), build Doctor + DoctorSchedule entities, save.
        throw new UnsupportedOperationException("TODO: implement registerDoctor");
    }

    public List<DoctorResponse> getAllDoctors() {
        // TODO(Arthur): map Doctor entities (with specialization + schedules)
        // to DoctorResponse. See DoctorController for the mock shape the
        // frontend is already coded against.
        throw new UnsupportedOperationException("TODO: implement getAllDoctors");
    }

    public void deleteDoctor(Long doctorId) {
        // TODO(Arthur): throw ResourceInUseException if
        // appointmentRepository.existsByDoctorId(doctorId) is true.
        throw new UnsupportedOperationException("TODO: implement deleteDoctor");
    }
}
