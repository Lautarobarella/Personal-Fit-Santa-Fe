# Etapa 1: Build con Java 21
FROM maven:3.9.4-eclipse-temurin-21 AS builder
WORKDIR /app
COPY Backend/pom.xml .
COPY Backend/src ./src
RUN mvn -f pom.xml clean package -DskipTests -Dspring.profiles.active=build

# Etapa 2: Runtime con Java 21
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
