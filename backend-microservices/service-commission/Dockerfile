FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-commission -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-commission/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["java", "-Xmx350m", "-jar", "app.jar"]
