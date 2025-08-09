package com.personalfit.personalfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.personalfit.personalfit.models.Settings;

@Repository
public interface ISettingsRepository extends JpaRepository<Settings, Long> {
    
    /**
     * Busca una configuración por su clave
     * @param key - Clave de la configuración
     * @return Optional<Settings> - Configuración encontrada o vacío
     */
    Optional<Settings> findByKey(String key);
    
    /**
     * Verifica si existe una configuración con la clave especificada
     * @param key - Clave de la configuración
     * @return boolean - true si existe, false en caso contrario
     */
    boolean existsByKey(String key);
} 