package com.personalfit.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.models.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

        /**
         * Finds a user by DNI, including logically deleted records.
         * Used for reactivation flows.
         */
        Optional<User> findByDni(Integer dni);

        Optional<User> findByDniAndDeletedAtIsNull(Integer dni);

        Optional<User> findByIdAndDeletedAtIsNull(Long id);

        List<User> findAllByDeletedAtIsNull();

        List<User> findAllByStatusAndDeletedAtIsNull(UserStatus status);

        List<User> findAllByStatusAndDeletedAtIsNullOrderByIdAsc(UserStatus status);

        long countByStatusAndDeletedAtIsNull(UserStatus status);

        List<User> findAllByBirthDateAndDeletedAtIsNull(LocalDate now);

        List<User> findAllByRoleAndDeletedAtIsNull(UserRole userRole);

        List<User> findByIdInAndDeletedAtIsNull(List<Long> id);

        @Query("SELECT u FROM User u WHERE u.status = :status AND u.deletedAt IS NULL AND u.lastAttendance < :dateLimit")
        List<User> findActiveUsersWithLastAttendanceBefore(
                        @Param("status") UserStatus status,
                        @Param("dateLimit") LocalDateTime dateLimit);

        @Query("SELECT u FROM User u WHERE u.status = :status AND u.deletedAt IS NULL AND FUNCTION('DATE', u.lastAttendance) = :dateLimit")
        List<User> findActiveUsersWithLastAttendanceOn(
                        @Param("status") UserStatus status,
                        @Param("dateLimit") LocalDate dateLimit);

        Optional<User> findByEmailAndDeletedAtIsNull(String email);

        Optional<User> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);
}
