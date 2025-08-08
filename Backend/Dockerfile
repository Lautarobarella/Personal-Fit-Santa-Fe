# Etapa 1: Build con Java 21
FROM maven:3.9.4-eclipse-temurin-21 AS builder
WORKDIR /app
COPY Backend/pom.xml ./
# Copiar dependencias primero para mejor caching
RUN mvn dependency:go-offline -f pom.xml
COPY Backend/src ./src
RUN mvn -f pom.xml clean package -DskipTests -Dspring.profiles.active=build

# Etapa 2: Runtime con Java 21 (alpine)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Instalar zona horaria de Argentina y curl para healthcheck
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/America/Argentina/Buenos_Aires /etc/localtime && \
    echo "America/Argentina/Buenos_Aires" > /etc/timezone

# Establecer TZ como variable de entorno
ENV TZ=America/Argentina/Buenos_Aires

# Crear directorio para logs
RUN mkdir -p /app/logs

COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080

# Healthcheck para verificar que la aplicación esté funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f https://personalfitsantafe.com:8080/api/health || exit 1

ENTRYPOINT ["java", "-Duser.timezone=America/Argentina/Buenos_Aires", "-jar", "app.jar"]
