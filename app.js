// Whistler coordinates
const WHISTLER_LAT = 50.1208;
const WHISTLER_LON = -122.9544;

// Chart instances
let tempChart, snowChart, cloudChart, windChart, accumulatedSnowChart, hourlySnowfallChart;

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

        // Fetch data for different elevations (for freeze level calculation)
        const peakUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WHISTLER_LAT}&longitude=${WHISTLER_LON}&current=temperature_2m&hourly=temperature_2m&elevation=2182&temperature_unit=celsius&forecast_days=3`;
        const midUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WHISTLER_LAT}&longitude=${WHISTLER_LON}&current=temperature_2m&hourly=temperature_2m&elevation=1850&temperature_unit=celsius&forecast_days=3`;
        const baseUrl = `https://api.open-meteo.com/v1/forecast?latitude=${WHISTLER_LAT}&longitude=${WHISTLER_LON}&current=temperature_2m&hourly=temperature_2m&elevation=675&temperature_unit=celsius&forecast_days=3`;

        // Fetch all data in parallel
        const [currentResponse, hourlyResponse, dailyResponse, peakResponse, midResponse, baseResponse] = await Promise.all([
            fetch(currentWeatherUrl),
            fetch(hourlyWeatherUrl),
            fetch(dailyWeatherUrl),
            fetch(peakUrl),
            fetch(midUrl),
            fetch(baseUrl)
        ]);

        const currentData = await currentResponse.json();
        const hourlyData = await hourlyResponse.json();
        const dailyData = await dailyResponse.json();
        const peakData = await peakResponse.json();
        const midData = await midResponse.json();
        const baseData = await baseResponse.json();

        // Update UI
        updateCurrentWeather(currentData, hourlyData);
        updateCharts(hourlyData, dailyData);
        updateDailyForecast(dailyData);
        updateHourlyForecast(hourlyData);
        updateSkiConditions(currentData, hourlyData);
        updateFreezeLevel(peakData, midData, baseData);

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

function updateCharts(hourlyData, dailyData) {
    const hourly = hourlyData.hourly;

    // Get next 48 hours of data
    const next48Hours = 48;
    const times = hourly.time.slice(0, next48Hours).map(time => {
        const date = new Date(time);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    });

    // ========== EPIC SNOWFALL PREDICTIONS ==========
    // Pass both hourly and daily data for epic snowfall predictions
    const combinedData = { hourly: hourly, daily: dailyData.daily };
    updateEpicSnowfall(hourly, combinedData);

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

function updateFreezeLevel(peakData, midData, baseData) {
    // Get current temperatures at different elevations
    const peakTemp = peakData.current.temperature_2m;
    const midTemp = midData.current.temperature_2m;
    const baseTemp = baseData.current.temperature_2m;

    // Elevations in meters
    const elevations = [
        { name: 'base', elevation: 675, temp: baseTemp },
        { name: 'mid', elevation: 1850, temp: midTemp },
        { name: 'peak', elevation: 2182, temp: peakTemp }
    ];

    // Calculate freeze level using linear interpolation
    let freezeLevel = 0;

    // Find where temperature crosses 0°C
    if (baseTemp <= 0) {
        freezeLevel = 0; // Below base elevation
    } else if (peakTemp >= 0) {
        freezeLevel = 2500; // Above peak elevation
    } else {
        // Interpolate between base and mid, or mid and peak
        if (midTemp >= 0) {
            // Freeze level is between mid and peak
            const tempDiff = midTemp - peakTemp;
            const elevDiff = 2182 - 1850;
            const tempToZero = midTemp;
            freezeLevel = 1850 + (tempToZero / tempDiff) * elevDiff;
        } else {
            // Freeze level is between base and mid
            const tempDiff = baseTemp - midTemp;
            const elevDiff = 1850 - 675;
            const tempToZero = baseTemp;
            freezeLevel = 675 + (tempToZero / tempDiff) * elevDiff;
        }
    }

    // Update freeze level display
    document.getElementById('freeze-level').textContent = Math.round(freezeLevel);

    // Update zone cards with temperatures and snow/rain status
    updateZoneCard('peak', peakTemp, freezeLevel, 2182);
    updateZoneCard('mid', midTemp, freezeLevel, 1850);
    updateZoneCard('base', baseTemp, freezeLevel, 675);

    // Create freeze level chart
    createFreezeLevelChart(peakData, midData, baseData, freezeLevel);
}

function updateZoneCard(zone, temp, freezeLevel, elevation) {
    const tempElement = document.getElementById(`${zone}-temp`);
    const statusElement = document.getElementById(`${zone}-status`);
    const card = document.querySelector(`.zone-card[data-zone="${zone}"]`);

    // Update temperature
    tempElement.textContent = `${Math.round(temp)}°C`;

    // Determine if snow or rain
    let status = '';
    let icon = '';
    let cardClass = '';

    if (temp <= 0) {
        status = 'Snow';
        icon = '❄️';
        cardClass = 'snow';
    } else if (temp > 0 && temp <= 2) {
        status = 'Snow/Mix';
        icon = '🌨️';
        cardClass = 'mix';
    } else {
        status = 'Rain';
        icon = '🌧️';
        cardClass = 'rain';
    }

    // Update status
    statusElement.innerHTML = `
        <span class="status-icon">${icon}</span>
        <span class="status-text">${status}</span>
    `;

    // Update card class
    card.className = `zone-card ${cardClass}`;
}

// ========== EPIC SNOWFALL PREDICTIONS FUNCTION ==========
function updateEpicSnowfall(hourly, hourlyData) {
    // Calculate snow totals
    const snow24h = hourly.snowfall.slice(0, 24).reduce((a, b) => a + b, 0);
    const snow48h = hourly.snowfall.slice(0, 48).reduce((a, b) => a + b, 0);
    const snow7d = hourly.snowfall.slice(0, 168).reduce((a, b) => a + b, 0); // 7 days = 168 hours

    // Update snow stats
    document.getElementById('snow-24h').textContent = (snow24h / 10).toFixed(1); // Convert mm to cm
    document.getElementById('snow-48h').textContent = (snow48h / 10).toFixed(1);
    document.getElementById('snow-7d').textContent = (snow7d / 10).toFixed(1);

    // Calculate snow quality (based on temperature - colder = better powder)
    const avgTemp = hourly.temperature_2m.slice(0, 24).reduce((a, b) => a + b, 0) / 24;
    let quality = '❄️';
    let qualityDesc = 'Dry Powder';
    let qualityClass = 'powder';

    if (avgTemp > 0) {
        quality = '💧';
        qualityDesc = 'Wet Snow';
        qualityClass = 'wet';
    } else if (avgTemp > -5) {
        quality = '❄️💧';
        qualityDesc = 'Mixed';
        qualityClass = 'mixed';
    }

    document.getElementById('snow-quality').textContent = quality;
    document.getElementById('snow-quality').className = `stat-value quality-indicator ${qualityClass}`;
    document.getElementById('snow-quality-desc').textContent = qualityDesc;

    // Powder Alert Banner
    const powderAlert = document.getElementById('powder-alert');
    if (snow24h > 100) { // More than 10cm in 24 hours = EPIC
        powderAlert.className = 'powder-alert-banner active epic';
        powderAlert.innerHTML = `🎿 POWDER ALERT! ${(snow24h / 10).toFixed(1)}cm expected in next 24 hours! 🎿`;
    } else if (snow24h > 50) { // More than 5cm
        powderAlert.className = 'powder-alert-banner active epic';
        powderAlert.innerHTML = `❄️ ${(snow24h / 10).toFixed(1)}cm of fresh snow coming in next 24 hours!`;
    } else {
        powderAlert.className = 'powder-alert-banner';
    }

    // Create Accumulated Snowfall Chart (7 days)
    const hours168 = 168; // 7 days
    const times7d = hourly.time.slice(0, hours168).map((time, i) => {
        if (i % 12 === 0) { // Show every 12 hours
            const date = new Date(time);
            return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
        }
        return '';
    });

    // Calculate accumulated snowfall
    let accumulated = [];
    let total = 0;
    for (let i = 0; i < hours168; i++) {
        total += hourly.snowfall[i] || 0;
        accumulated.push(total / 10); // Convert to cm
    }

    const accumulatedData = {
        labels: times7d,
        datasets: [{
            label: 'Accumulated Snowfall (cm)',
            data: accumulated,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.3,
            fill: true,
            borderWidth: 3
        }]
    };

    if (accumulatedSnowChart) {
        accumulatedSnowChart.destroy();
    }
    accumulatedSnowChart = new Chart(document.getElementById('accumulatedSnowChart'), {
        type: 'line',
        data: accumulatedData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Total: ${context.parsed.y.toFixed(1)} cm`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Accumulated Snow (cm)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' cm';
                        }
                    }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    // Create Hourly Snowfall Intensity Chart (48 hours)
    const next48Hours = 48;
    const times48h = hourly.time.slice(0, next48Hours).map(time => {
        const date = new Date(time);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    });

    // Create gradient colors - highlight intense snowfall
    const snowfallColors = hourly.snowfall.slice(0, next48Hours).map(snow => {
        const cm = snow / 10;
        if (cm > 2) return 'rgba(16, 185, 129, 0.9)'; // Epic - bright green
        if (cm > 1) return 'rgba(6, 182, 212, 0.8)'; // Good - cyan
        if (cm > 0.5) return 'rgba(59, 130, 246, 0.7)'; // Moderate - blue
        return 'rgba(156, 163, 175, 0.5)'; // Light - gray
    });

    const hourlySnowfallData = {
        labels: times48h,
        datasets: [{
            label: 'Snowfall per Hour (cm)',
            data: hourly.snowfall.slice(0, next48Hours).map(snow => snow / 10),
            backgroundColor: snowfallColors,
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1
        }]
    };

    if (hourlySnowfallChart) {
        hourlySnowfallChart.destroy();
    }
    hourlySnowfallChart = new Chart(document.getElementById('hourlySnowfallChart'), {
        type: 'bar',
        data: hourlySnowfallData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const cm = context.parsed.y;
                            if (cm > 2) return `${cm.toFixed(1)} cm - EPIC! 🎿`;
                            if (cm > 1) return `${cm.toFixed(1)} cm - Great! ❄️`;
                            if (cm > 0.5) return `${cm.toFixed(1)} cm - Good`;
                            return `${cm.toFixed(1)} cm`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Snowfall (cm/hour)',
                        font: { weight: 'bold' }
                    }
                },
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                }
            }
        }
    });

    // Create Daily Snow Bars (using daily data if available)
    if (hourlyData.daily && hourlyData.daily.snowfall_sum) {
        const dailyBarsContainer = document.getElementById('daily-snow-bars');
        const maxSnow = Math.max(...hourlyData.daily.snowfall_sum);

        dailyBarsContainer.innerHTML = hourlyData.daily.time.slice(0, 7).map((day, i) => {
            const date = new Date(day);
            const dayName = date.toLocaleString('en-US', { weekday: 'short' });
            const snowCm = hourlyData.daily.snowfall_sum[i];
            const percentage = maxSnow > 0 ? (snowCm / maxSnow) * 100 : 0;

            return `
                <div class="daily-snow-bar">
                    <div class="snow-bar-day">${dayName}</div>
                    <div class="snow-bar-visual">
                        <div class="snow-bar-fill" style="width: ${percentage}%">
                            <span class="snow-bar-amount">${snowCm.toFixed(1)} cm</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function createFreezeLevelChart(peakData, midData, baseData) {
    const ctx = document.getElementById('freezeLevelChart');

    // Get next 24 hours of data
    const hours = 24;
    const labels = [];
    const peakTemps = [];
    const midTemps = [];
    const baseTemps = [];

    for (let i = 0; i < hours; i++) {
        const time = new Date(peakData.hourly.time[i]);
        labels.push(time.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }));
        peakTemps.push(peakData.hourly.temperature_2m[i]);
        midTemps.push(midData.hourly.temperature_2m[i]);
        baseTemps.push(baseData.hourly.temperature_2m[i]);
    }

    // Destroy existing chart if it exists
    if (window.freezeLevelChart) {
        window.freezeLevelChart.destroy();
    }

    window.freezeLevelChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Peak (2,182m)',
                    data: peakTemps,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Mid-Mountain (1,850m)',
                    data: midTemps,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Village Base (675m)',
                    data: baseTemps,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Freeze Line (0°C)',
                    data: Array(hours).fill(0),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Temperature by Elevation (24 Hours)',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    grid: {
                        color: (context) => {
                            if (context.tick.value === 0) {
                                return '#ef4444';
                            }
                            return 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
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
