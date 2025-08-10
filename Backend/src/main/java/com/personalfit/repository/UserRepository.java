package com.personalfit.repository;

import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.models.User;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.personalfit.models.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByDni(Integer dni);
    List<User> findAllByStatus(UserStatus status);
    List<User> findAllByBirthDate(LocalDate now);
    List<User> findAllByRole(UserRole userRole);
    List<User> findByIdIn(List<Long> id);

    // IUserRepository.java
    @Query("SELECT u FROM User u WHERE u.status = :status AND u.lastAttendance < :dateLimit")
    List<User> findActiveUsersWithLastAttendanceBefore(
            @Param("status") UserStatus status,
            @Param("dateLimit") LocalDateTime dateLimit
    );

    @Query("SELECT u FROM User u WHERE u.status = :status AND FUNCTION('DATE', u.lastAttendance) = :dateLimit")
    List<User> findActiveUsersWithLastAttendanceOn(
            @Param("status") UserStatus status,
            @Param("dateLimit") LocalDate dateLimit
    );
    Optional<User> findByEmail(String email);
}
