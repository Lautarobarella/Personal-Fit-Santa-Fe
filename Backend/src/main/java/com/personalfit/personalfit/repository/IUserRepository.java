package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByDni(Integer dni);

    List<User> findAllByStatus(UserStatus status);

    List<User> findAllByBirthDate(LocalDate now);
}
