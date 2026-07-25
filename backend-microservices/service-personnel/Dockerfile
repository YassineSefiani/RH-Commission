FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-personnel -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-personnel/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-Xmx350m", "-jar", "app.jar"]
