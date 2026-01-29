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
         * Finds a user by their Document Number (DNI).
         */
        Optional<User> findByDni(Integer dni);

        /**
         * Finds all users with a specific status (ACTIVE/INACTIVE).
         */
        List<User> findAllByStatus(UserStatus status);

        /**
         * Finds all users born on a specific date (ignoring year is handled by service
         * logic,
         * but this method finds by exact LocalDate usually, so wait.
         * Service logic: `userRepository.findAllByBirthDate(LocalDate.now())`.
         * Actually, if `BirthDate` is YYYY-MM-DD, `findAllByBirthDate(now)` searches
         * for people born TODAY.
         * That's weird for a birthday check unless the service handles it differently
         * or query is custom?
         * Checking Service: `userRepository.findAllByBirthDate(LocalDate.now());`
         * This looks like a bug in logic IF birthdate includes year.
         * However, I am just documenting.
         */
        List<User> findAllByBirthDate(LocalDate now);

        /**
         * Finds all users with a specific role.
         */
        List<User> findAllByRole(UserRole userRole);

        /**
         * Finds users by a list of IDs.
         */
        List<User> findByIdIn(List<Long> id);

        /**
         * Finds active users who haven't attended since a specific date limit.
         */
        @Query("SELECT u FROM User u WHERE u.status = :status AND u.lastAttendance < :dateLimit")
        List<User> findActiveUsersWithLastAttendanceBefore(
                        @Param("status") UserStatus status,
                        @Param("dateLimit") LocalDateTime dateLimit);

        /**
         * Finds active users whose last attendance was exactly on a specific date.
         */
        @Query("SELECT u FROM User u WHERE u.status = :status AND FUNCTION('DATE', u.lastAttendance) = :dateLimit")
        List<User> findActiveUsersWithLastAttendanceOn(
                        @Param("status") UserStatus status,
                        @Param("dateLimit") LocalDate dateLimit);

        /**
         * Finds a user by their email address.
         */
        Optional<User> findByEmail(String email);
}
