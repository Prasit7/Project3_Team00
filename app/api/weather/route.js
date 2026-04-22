import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VALID_UNITS = new Set(["metric", "imperial"]);

const WEATHER_CODE_LABELS = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const WEATHER_CODE_ICONS = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌦️",
  63: "🌧️",
  65: "🌧️",
  66: "🌧️",
  67: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "⛈️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

function buildForecastUrl({ lat, lon, units }) {
  const temperatureUnit = units === "imperial" ? "fahrenheit" : "celsius";
  const windSpeedUnit = units === "imperial" ? "mph" : "kmh";

  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
    timezone: "auto",
  });

  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

async function geocodeCity(city) {
  const params = new URLSearchParams({
    name: city,
    count: "1",
    language: "en",
    format: "json",
  });

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.reason || "Location lookup failed.");
  }

  const match = Array.isArray(payload?.results) ? payload.results[0] : null;
  if (!match) {
    throw new Error("City not found.");
  }

  return {
    lat: String(match.latitude),
    lon: String(match.longitude),
    city: match.name || city,
    country: match.country_code || "",
  };
}

function parseRequest(searchParams) {
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");
  const requestedUnits = searchParams.get("units");
  const units = VALID_UNITS.has(requestedUnits) ? requestedUnits : "imperial";

  if (lat && lon) {
    return {
      lat,
      lon,
      city: "Current location",
      country: "",
      units,
    };
  }

  if (city) {
    return {
      city,
      units,
    };
  }

  return null;
}

export async function GET(request) {
  const parsed = parseRequest(request.nextUrl.searchParams);

  if (!parsed) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Provide either "lat" and "lon", or "city".',
      },
      { status: 400 }
    );
  }

  try {
    const location = parsed.lat && parsed.lon ? parsed : await geocodeCity(parsed.city);
    const forecastResponse = await fetch(buildForecastUrl({ ...location, units: parsed.units }), {
      cache: "no-store",
    });
    const forecastPayload = await forecastResponse.json();

    if (!forecastResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: forecastPayload?.reason || "Weather lookup failed.",
        },
        { status: forecastResponse.status }
      );
    }

    const current = forecastPayload?.current;
    if (!current) {
      throw new Error("Current weather data is unavailable.");
    }

    return NextResponse.json({
      ok: true,
      location: {
        city: location.city,
        country: location.country,
      },
      weather: {
        description: WEATHER_CODE_LABELS[current.weather_code] || "Current weather",
        icon: WEATHER_CODE_ICONS[current.weather_code] || "🌤️",
        temperature: current.temperature_2m ?? null,
        feelsLike: current.apparent_temperature ?? null,
        humidity: current.relative_humidity_2m ?? null,
        windSpeed: current.wind_speed_10m ?? null,
        units: parsed.units,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Unable to load weather data.",
      },
      { status: 500 }
    );
  }
}
