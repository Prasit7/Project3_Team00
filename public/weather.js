function setWeatherStatus(config, message) {
  const status = document.getElementById(config.statusId);
  if (status) {
    status.textContent = message;
  }
}

function setWeatherError(config, messageKey) {
  const fallback = {
    weatherUnavailable: "Weather is unavailable in this browser.",
    weatherPermissionDenied: "Location permission is required to load local weather.",
    weatherFailed: "Weather could not be loaded right now.",
  };

  setWeatherStatus(config, typeof t === "function" ? t(messageKey) : fallback[messageKey]);
}

function updateWeatherCard(config, data) {
  const status = document.getElementById(config.statusId);
  const temp = document.getElementById(config.tempId);
  const iconWrap = document.getElementById(config.iconWrapId);
  const icon = document.getElementById(config.iconId);

  if (!status) {
    return;
  }

  const description = data.weather.description || "";

  status.textContent = description
    ? description.charAt(0).toUpperCase() + description.slice(1)
    : (typeof t === "function" ? t("weatherTitle") : "Weather");

  if (temp && Number.isFinite(data.weather.temperature)) {
    temp.textContent = `${Math.round(data.weather.temperature)}°`;
  }

  if (data.weather.icon && icon && iconWrap) {
    icon.textContent = data.weather.icon;
    icon.setAttribute("aria-label", description || "Weather icon");
    iconWrap.hidden = false;
  }
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
}
