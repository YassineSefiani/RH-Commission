FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-auth -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-auth/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-Xmx350m", "-jar", "app.jar"]
