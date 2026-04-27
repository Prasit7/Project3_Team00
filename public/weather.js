function getTemperatureUnitLabel(units) {
  if (units === "metric") return "C";
  if (units === "standard") return "K";
  return "F";
}

function setWeatherStatus(config, message) {
  const status = document.getElementById(config.statusId);
  if (status) {
    status.textContent = message;
  }
}

function getCurrentLang() {
  return (localStorage.getItem("lang") || document.documentElement.getAttribute("lang") || "en").toLowerCase();
}

function toSpanishWeatherDescription(description) {
  const replacements = [
    [/thunderstorm/gi, "tormenta electrica"],
    [/drizzle/gi, "llovizna"],
    [/rain/gi, "lluvia"],
    [/snow/gi, "nieve"],
    [/mist/gi, "neblina"],
    [/smoke/gi, "humo"],
    [/haze/gi, "calima"],
    [/dust/gi, "polvo"],
    [/fog/gi, "niebla"],
    [/sand/gi, "arena"],
    [/ash/gi, "ceniza"],
    [/squall/gi, "turbonada"],
    [/tornado/gi, "tornado"],
    [/clear sky/gi, "cielo despejado"],
    [/clear/gi, "despejado"],
    [/few clouds/gi, "pocas nubes"],
    [/scattered clouds/gi, "nubes dispersas"],
    [/broken clouds/gi, "nubes fragmentadas"],
    [/overcast clouds/gi, "nublado"],
    [/clouds/gi, "nublado"],
  ];

  let text = String(description || "");
  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  return text;
}

function setWeatherError(config, messageKey) {
  const lang = getCurrentLang();
  const fallback = lang === "es"
    ? {
      weatherUnavailable: "El clima no esta disponible en este navegador.",
      weatherPermissionDenied: "Se necesita permiso de ubicacion para cargar el clima local.",
      weatherFailed: "No se pudo cargar el clima en este momento.",
    }
    : {
    weatherUnavailable: "Weather is unavailable in this browser.",
    weatherPermissionDenied: "Location permission is required to load local weather.",
    weatherFailed: "Weather could not be loaded right now.",
  };

  setWeatherStatus(config, fallback[messageKey]);
}

function updateWeatherCard(config, data) {
  const status = document.getElementById(config.statusId);
  const temp = document.getElementById(config.tempId);
  const iconWrap = document.getElementById(config.iconWrapId);
  const icon = document.getElementById(config.iconId);

  if (!status) {
    return;
  }

  const lang = getCurrentLang();
  const rawDescription = data.weather.description || "";
  const description = lang === "es" ? toSpanishWeatherDescription(rawDescription) : rawDescription;
  status.setAttribute("data-weather-raw", rawDescription);

  status.textContent = description
    ? description.charAt(0).toUpperCase() + description.slice(1)
    : (lang === "es" ? "Clima" : "Weather");

  if (temp && Number.isFinite(data.weather.temperature)) {
    temp.textContent = `${Math.round(data.weather.temperature)}°${getTemperatureUnitLabel(data.weather.units)}`;
  }

  if (data.weather.icon && icon && iconWrap) {
    icon.textContent = data.weather.icon;
    icon.setAttribute("aria-label", description || (lang === "es" ? "Icono del clima" : "Weather icon"));
    iconWrap.hidden = false;
  }
}

function relocalizeCurrentWeather(config) {
  const status = document.getElementById(config.statusId);
  if (!status) return;

  const original = status.getAttribute("data-weather-raw");
  if (!original) return;
  const lang = getCurrentLang();
  const next = lang === "es" ? toSpanishWeatherDescription(original) : original;
  status.textContent = next ? next.charAt(0).toUpperCase() + next.slice(1) : (lang === "es" ? "Clima" : "Weather");
}

async function fetchWeatherData(params) {
  const response = await fetch(`/api/weather?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Weather request failed.");
  }

  return payload;
}

async function loadFallbackWeather(config) {
  if (!config.fallbackCity) {
    return false;
  }

  try {
    const params = new URLSearchParams({
      city: config.fallbackCity,
      units: config.units || "imperial",
    });
    const weather = await fetchWeatherData(params);
    updateWeatherCard(config, weather);
    return true;
  } catch (_error) {
    return false;
  }
}

async function loadWeatherWidget(config) {
  const hasRenderedFallback = await loadFallbackWeather(config);

  if (!navigator.geolocation) {
    if (!hasRenderedFallback) {
      setWeatherError(config, "weatherUnavailable");
    }
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async ({ coords }) => {
      try {
        const params = new URLSearchParams({
          lat: String(coords.latitude),
          lon: String(coords.longitude),
          units: config.units || "imperial",
        });
        const weather = await fetchWeatherData(params);
        updateWeatherCard(config, weather);
      } catch (_error) {
        if (!hasRenderedFallback) {
          setWeatherError(config, "weatherFailed");
        }
      }
    },
    () => {
      if (!hasRenderedFallback) {
        setWeatherError(config, "weatherPermissionDenied");
      }
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    }
  );

  window.addEventListener("app:languagechange", () => {
    relocalizeCurrentWeather(config);
  });
}
