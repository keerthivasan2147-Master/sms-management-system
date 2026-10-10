# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project file from subfolder and restore dependencies
COPY ["SMS.API/SMS.API.csproj", "SMS.API/"]
RUN dotnet restore "SMS.API/SMS.API.csproj"

# Copy all source files and publish
COPY SMS.API/. SMS.API/
WORKDIR /src/SMS.API
RUN dotnet publish -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Render injects PORT env variable (default 10000)
ENV ASPNETCORE_URLS=http://+:${PORT:-10000}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000

ENTRYPOINT ["dotnet", "SMS.API.dll"]
