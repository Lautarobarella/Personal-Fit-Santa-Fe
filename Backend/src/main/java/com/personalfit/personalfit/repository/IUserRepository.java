package com.personalfit.personalfit.repository;

import com.personalfit.personalfit.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByDni(Integer dni);
    Optional<User> findByEmail(String email);
}
