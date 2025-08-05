# Etapa 1: Build con Java 21
FROM maven:3.9.4-eclipse-temurin-21 AS builder
WORKDIR /app
COPY Backend/pom.xml ./
COPY Backend/src ./src
RUN mvn -f pom.xml clean package -DskipTests

# Etapa 2: Runtime con Java 21 (alpine)
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Instalar zona horaria de Argentina
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/America/Argentina/Buenos_Aires /etc/localtime && \
    echo "America/Argentina/Buenos_Aires" > /etc/timezone

# Establecer TZ como variable de entorno (opcional pero recomendable)
ENV TZ=America/Argentina/Buenos_Aires

COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", "-Duser.timezone=America/Argentina/Buenos_Aires", "-jar", "app.jar"]
#CMD ["sh"]
