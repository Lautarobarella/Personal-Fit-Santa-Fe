package com.personalfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.personalfit.models.MonthlyRevenue;

@Repository
public interface MonthlyRevenueRepository extends JpaRepository<MonthlyRevenue, Long> {

    /**
     * Busca el registro de ingresos para un año y mes específicos
     */
    Optional<MonthlyRevenue> findByYearAndMonth(Integer year, Integer month);

    /**
     * Obtiene todos los registros de ingresos archivados (meses cerrados)
     * ordenados por año y mes descendente
     */
    @Query("SELECT mr FROM MonthlyRevenue mr WHERE mr.archivedAt IS NOT NULL ORDER BY mr.year DESC, mr.month DESC")
    List<MonthlyRevenue> findArchivedRevenues();

    /**
     * Obtiene el registro actual del mes (no archivado)
     */
    @Query("SELECT mr FROM MonthlyRevenue mr WHERE mr.archivedAt IS NULL")
    Optional<MonthlyRevenue> findCurrentMonthRevenue();

    /**
     * Obtiene los ingresos de los últimos N meses archivados
     */
    @Query("SELECT mr FROM MonthlyRevenue mr WHERE mr.archivedAt IS NOT NULL ORDER BY mr.year DESC, mr.month DESC")
    List<MonthlyRevenue> findLastArchivedRevenues(@Param("limit") Integer limit);
}
