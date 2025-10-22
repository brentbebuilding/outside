// Whistler coordinates
const WHISTLER_LAT = 50.1208;
const WHISTLER_LON = -122.9544;

// Chart instances
let tempChart, snowChart, cloudChart, windChart;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeDarkMode();
    fetchWeatherData();
    // Refresh data every 10 minutes
    setInterval(fetchWeatherData, 600000);
});

// Dark Mode functionality
function initializeDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');

    // Apply saved preference or default to light mode
    if (savedDarkMode === 'enabled') {
        body.classList.add('dark-mode');
    }

    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        // Save preference to localStorage
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    });
}

async function fetchWeatherData() {
    try {
        // Open-Meteo API endpoints
        const currentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WHISTLER_LAT}&longitude=${WHISTLER_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`;

        const hourlyWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WHISTLER_LAT}&longitude=${WHISTLER_LON}&hourly=temperature_2m,precipitation,snowfall,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,weather_code,snow_depth&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm&forecast_days=7`;

        const dailyWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WHISTLER_LAT}&longitude=${WHISTLER_LON}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm`;

        // Fetch all data in parallel
        const [currentResponse, hourlyResponse, dailyResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(hourlyWeatherUrl),
            fetch(dailyWeatherUrl)
        ]);

        const currentData = await currentResponse.json();
        const hourlyData = await hourlyResponse.json();
        const dailyData = await dailyResponse.json();

        // Update UI
        updateCurrentWeather(currentData, hourlyData);
        updateCharts(hourlyData);
        updateDailyForecast(dailyData);
        updateHourlyForecast(hourlyData);
        updateSkiConditions(currentData, hourlyData);

        // Update last updated time
        document.getElementById('last-updated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('last-updated').textContent = `Error loading data. Retrying...`;
    }
}

function updateCurrentWeather(currentData, hourlyData) {
    const current = currentData.current;

    // Get current hour's snow depth
    const currentHour = new Date().getHours();
    const snowDepth = hourlyData.hourly.snow_depth[currentHour] || 0;
    const visibility = hourlyData.hourly.visibility[currentHour] || 0;

    document.getElementById('current-temp').textContent = Math.round(current.temperature_2m);
    document.getElementById('feels-like').textContent = Math.round(current.apparent_temperature);
    document.getElementById('snow-depth').textContent = Math.round(snowDepth);
    document.getElementById('cloud-cover').textContent = current.cloud_cover;
    document.getElementById('precipitation').textContent = current.precipitation.toFixed(1);
    document.getElementById('wind-speed').textContent = Math.round(current.wind_speed_10m);
    document.getElementById('wind-direction').textContent = current.wind_direction_10m;
    document.getElementById('visibility').textContent = (visibility / 1000).toFixed(1);
}

function updateCharts(hourlyData) {
    const hourly = hourlyData.hourly;

    // Get next 48 hours of data
    const next48Hours = 48;
    const times = hourly.time.slice(0, next48Hours).map(time => {
        const date = new Date(time);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    });

    // Temperature Chart
    const tempData = {
        labels: times,
        datasets: [{
            label: 'Temperature (°C)',
            data: hourly.temperature_2m.slice(0, next48Hours),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    if (tempChart) {
        tempChart.destroy();
    }
    tempChart = new Chart(document.getElementById('tempChart'), {
        type: 'line',
        data: tempData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true },
                title: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: 'Temperature (°C)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    // Snowfall & Precipitation Chart
    const snowData = {
        labels: times,
        datasets: [
            {
                label: 'Snowfall (mm)',
                data: hourly.snowfall.slice(0, next48Hours),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgb(54, 162, 235)',
                type: 'bar'
            },
            {
                label: 'Rain (mm)',
                data: hourly.precipitation.slice(0, next48Hours).map((precip, i) => {
                    const snow = hourly.snowfall[i] || 0;
                    return Math.max(0, precip - snow);
                }),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgb(75, 192, 192)',
                type: 'bar'
            }
        ]
    };

    if (snowChart) {
        snowChart.destroy();
    }
    snowChart = new Chart(document.getElementById('snowChart'), {
        type: 'bar',
        data: snowData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Precipitation (mm)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    // Cloud Cover Chart
    const cloudData = {
        labels: times,
        datasets: [{
            label: 'Cloud Cover (%)',
            data: hourly.cloud_cover.slice(0, next48Hours),
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.3)',
            tension: 0.4,
            fill: true
        }]
    };

    if (cloudChart) {
        cloudChart.destroy();
    }
    cloudChart = new Chart(document.getElementById('cloudChart'), {
        type: 'line',
        data: cloudData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Cloud Cover (%)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    // Wind Speed Chart
    const windData = {
        labels: times,
        datasets: [{
            label: 'Wind Speed (km/h)',
            data: hourly.wind_speed_10m.slice(0, next48Hours),
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            tension: 0.4,
            fill: true
        }]
    };

    if (windChart) {
        windChart.destroy();
    }
    windChart = new Chart(document.getElementById('windChart'), {
        type: 'line',
        data: windData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Wind Speed (km/h)' }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });
}

function updateDailyForecast(dailyData) {
    const daily = dailyData.daily;
    const forecastContainer = document.getElementById('daily-forecast');
    forecastContainer.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const date = new Date(daily.time[i]);
        const dayName = i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="date">${monthDay}</div>
            <div class="weather-icon">${getWeatherEmoji(daily.weather_code[i])}</div>
            <div class="temp-high">${Math.round(daily.temperature_2m_max[i])}°</div>
            <div class="temp-low">${Math.round(daily.temperature_2m_min[i])}°</div>
            <div class="snow-info">
                <div>Snow: ${daily.snowfall_sum[i].toFixed(1)} cm</div>
                <div>Precip: ${daily.precipitation_probability_max[i]}%</div>
                <div>Wind: ${Math.round(daily.wind_speed_10m_max[i])} km/h</div>
            </div>
        `;
        forecastContainer.appendChild(card);
    }
}

function updateHourlyForecast(hourlyData) {
    const hourly = hourlyData.hourly;
    const hourlyContainer = document.getElementById('hourly-forecast');
    hourlyContainer.innerHTML = '';

    // Show next 24 hours
    for (let i = 0; i < 24; i++) {
        const time = new Date(hourly.time[i]);
        const hour = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const card = document.createElement('div');
        card.className = 'hourly-card';
        card.innerHTML = `
            <div class="time">${hour}</div>
            <div class="weather-icon">${getWeatherEmoji(hourly.weather_code[i])}</div>
            <div class="temp">${Math.round(hourly.temperature_2m[i])}°C</div>
            <div class="conditions">
                <div>☁️ ${hourly.cloud_cover[i]}%</div>
                <div>❄️ ${hourly.snowfall[i].toFixed(1)} mm</div>
                <div>💨 ${Math.round(hourly.wind_speed_10m[i])} km/h</div>
            </div>
        `;
        hourlyContainer.appendChild(card);
    }
}

function updateSkiConditions(currentData, hourlyData) {
    const alertBox = document.getElementById('ski-alert');
    const temp = currentData.current.temperature_2m;
    const windSpeed = currentData.current.wind_speed_10m;
    const cloudCover = currentData.current.cloud_cover;
    const visibility = hourlyData.hourly.visibility[new Date().getHours()] / 1000; // km

    // Calculate next 6 hours snowfall
    const next6HoursSnow = hourlyData.hourly.snowfall.slice(0, 6).reduce((a, b) => a + b, 0);

    let condition = 'good';
    let message = '';

    // Excellent conditions
    if (temp >= -10 && temp <= -2 && windSpeed < 20 && cloudCover < 30 && visibility > 8) {
        condition = 'excellent';
        message = `⛷️ Excellent skiing conditions! Temperature: ${Math.round(temp)}°C, Low wind, Great visibility. ${next6HoursSnow > 0 ? `Fresh powder incoming: ${next6HoursSnow.toFixed(1)}cm in next 6 hours!` : ''}`;
    }
    // Good conditions
    else if (temp >= -15 && temp <= 5 && windSpeed < 30 && visibility > 5) {
        condition = 'good';
        message = `✅ Good skiing conditions. Temperature: ${Math.round(temp)}°C, Wind: ${Math.round(windSpeed)} km/h. ${next6HoursSnow > 0 ? `Snowfall expected: ${next6HoursSnow.toFixed(1)}cm in next 6 hours.` : ''}`;
    }
    // Fair conditions
    else if (temp > -20 && windSpeed < 40) {
        condition = 'fair';
        message = `⚠️ Fair conditions. ${temp < -15 ? 'Very cold!' : ''} ${windSpeed > 25 ? 'Windy conditions.' : ''} ${visibility < 5 ? 'Reduced visibility.' : ''} Dress appropriately.`;
    }
    // Poor conditions
    else {
        condition = 'poor';
        message = `❌ Poor skiing conditions. ${temp < -20 ? 'Extremely cold! ' : ''} ${windSpeed > 40 ? 'Dangerous wind speeds. ' : ''} ${visibility < 2 ? 'Very low visibility. ' : ''} Consider waiting for better weather.`;
    }

    alertBox.className = `alert-box ${condition}`;
    alertBox.innerHTML = message;
}

function getWeatherEmoji(weatherCode) {
    // WMO Weather interpretation codes
    const weatherCodes = {
        0: '☀️',    // Clear sky
        1: '🌤️',   // Mainly clear
        2: '⛅',   // Partly cloudy
        3: '☁️',   // Overcast
        45: '🌫️',  // Fog
        48: '🌫️',  // Depositing rime fog
        51: '🌦️',  // Light drizzle
        53: '🌧️',  // Moderate drizzle
        55: '🌧️',  // Dense drizzle
        61: '🌧️',  // Slight rain
        63: '🌧️',  // Moderate rain
        65: '🌧️',  // Heavy rain
        71: '🌨️',  // Slight snow
        73: '❄️',   // Moderate snow
        75: '❄️',   // Heavy snow
        77: '❄️',   // Snow grains
        80: '🌦️',  // Slight rain showers
        81: '🌧️',  // Moderate rain showers
        82: '⛈️',  // Violent rain showers
        85: '🌨️',  // Slight snow showers
        86: '❄️',   // Heavy snow showers
        95: '⛈️',  // Thunderstorm
        96: '⛈️',  // Thunderstorm with slight hail
        99: '⛈️'   // Thunderstorm with heavy hail
    };

    return weatherCodes[weatherCode] || '🌡️';
}
