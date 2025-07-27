package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IAttendanceRepository extends JpaRepository<Attendance, Integer> {
}
