# 📊 Reportes de Personal Fit Santa Fe

Este directorio contiene los reportes generados por el sistema de CI/CD.

## 📁 Estructura de Directorios

- **deployment/**: Reportes de deployments
- **testing/**: Reportes de testing y cobertura
- **linting/**: Reportes de análisis de código
- **performance/**: Reportes de rendimiento

## 📝 Tipos de Reportes

### Deployment Reports
- **deployment-YYYYMMDD_HHMMSS.md**: Reporte detallado de cada deployment
- Incluye información sobre el commit, duración, estado y métricas

### Testing Reports
- **eslint-report.json**: Reporte de ESLint para el frontend
- **coverage/**: Reportes de cobertura de código

### Performance Reports
- **health-check-YYYYMMDD_HHMMSS.log**: Logs de health checks
- **performance-metrics.json**: Métricas de rendimiento de la aplicación

## 🔧 Configuración

Los reportes se generan automáticamente durante el proceso de CI/CD.
Para generar reportes manualmente, ejecuta los scripts correspondientes en `/scripts/`.
