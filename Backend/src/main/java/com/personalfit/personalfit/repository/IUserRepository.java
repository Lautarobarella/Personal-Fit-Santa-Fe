package com.personalfit.personalfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.personalfit.models.User;

@Repository
public interface IUserRepository extends JpaRepository<User, Long> {
    Optional<User> findByDni(Integer dni);
    Optional<User> findByEmail(String email);
}
