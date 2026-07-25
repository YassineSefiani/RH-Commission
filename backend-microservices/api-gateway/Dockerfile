FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl api-gateway -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx250m", "-jar", "app.jar"]
