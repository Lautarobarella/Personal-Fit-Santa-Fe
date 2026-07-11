package com.personalfit.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

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

        /**
         * Loads users by DNI acquiring a pessimistic write lock so concurrent
         * admin batch-payment requests over the same clients serialize instead
         * of both passing the eligibility validation. Rows are ordered by id so
         * every transaction acquires the locks in the same canonical order,
         * preventing deadlocks between overlapping batches.
         */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT u FROM User u WHERE u.dni IN :dnis AND u.deletedAt IS NULL ORDER BY u.id")
        List<User> findAllByDniInAndDeletedAtIsNullForUpdate(@Param("dnis") Collection<Integer> dnis);
}
