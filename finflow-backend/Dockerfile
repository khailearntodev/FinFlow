# Stage 1: Build file JAR
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
# Copy file pom.xml và tải dependencies trước (tận dụng cache)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy toàn bộ source code và build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Chạy ứng dụng
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy file JAR đã build từ Stage 1 sang Stage 2
COPY --from=build /app/target/*.jar app.jar

# Expose port mặc định của Spring Boot
EXPOSE 8080

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]