# Whistler Winter Weather App

A comprehensive, real-time winter weather application specifically designed for Whistler, BC. Built with 100% open source technologies and free weather APIs.

## Features

### Current Conditions
- **Real-time metrics**: Temperature, feels-like temperature, snow depth, cloud cover, precipitation, wind speed/direction, and visibility
- **Automatic updates**: Data refreshes every 10 minutes
- **Winter-focused**: Snow depth and ski-specific conditions

### Visual Charts & Graphs
- **Temperature Forecast**: 48-hour temperature trend
- **Snowfall & Precipitation**: Detailed snow and rain predictions
- **Cloud Cover Prediction**: Cloud coverage forecast for planning
- **Wind Speed**: Wind conditions for the next 48 hours

### Forecasts
- **7-Day Forecast**: Daily high/low temperatures, snowfall totals, precipitation probability, and max wind speed
- **24-Hour Detailed**: Hourly breakdown with conditions, cloud cover, snowfall, and wind
- **Ski Conditions Alert**: Intelligent assessment of current skiing conditions based on multiple factors

## Technology Stack

### 100% Open Source
- **HTML/CSS/JavaScript**: No framework dependencies, lightweight and fast
- **Chart.js**: Open source charting library for beautiful visualizations
- **Open-Meteo API**: Free, open source weather API (no API key required)

### Weather Data Sources
All data comes from [Open-Meteo](https://open-meteo.com/), which aggregates data from:
- NOAA (National Oceanic and Atmospheric Administration)
- DWD (German Weather Service)
- Météo-France
- And other open weather models

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local development server) OR any static file server

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd outside
```

2. Open the app in your browser:

**Option A: Using Python (recommended)**
```bash
python -m http.server 8000
# or
python3 -m http.server 8000
```
Then visit: `http://localhost:8000`

**Option B: Using Node.js**
```bash
npx http-server
```

**Option C: Direct file access**
Simply open `index.html` directly in your web browser (some features may be limited due to CORS)

### Deployment

This is a static web application that can be deployed to any web hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any static web host

No build process or server-side code required!

## Usage

The app automatically loads and displays:
1. **Current conditions** for Whistler, BC
2. **Ski conditions assessment** based on temperature, wind, visibility, and upcoming snowfall
3. **Interactive charts** showing 48-hour forecasts
4. **7-day outlook** with daily summaries
5. **24-hour detailed forecast** with hourly conditions

All data updates automatically every 10 minutes while the page is open.

## Features Explained

### Ski Conditions Assessment
The app intelligently evaluates skiing conditions based on:
- **Temperature**: Ideal range -10°C to -2°C
- **Wind Speed**: Lower is better (dangerous above 40 km/h)
- **Visibility**: Important for safety
- **Cloud Cover**: Affects visibility and experience
- **Upcoming Snow**: Shows expected powder in next 6 hours

Conditions are rated as:
- **Excellent**: Optimal skiing weather
- **Good**: Safe and enjoyable conditions
- **Fair**: Acceptable but with some challenges
- **Poor**: Consider waiting for better weather

### Weather Charts
1. **Temperature Chart**: Helps plan what to wear
2. **Snowfall Chart**: Shows when fresh powder is expected
3. **Cloud Cover Chart**: Helps predict visibility and sunshine
4. **Wind Chart**: Important for wind chill and lift operations

## API Information

### Open-Meteo API
- **Cost**: 100% Free, no API key required
- **Rate Limits**: Generous free tier
- **Data**: High-quality forecasts updated hourly
- **Coverage**: Global coverage with detailed data
- **Privacy**: No tracking or data collection

### Whistler Location
- **Latitude**: 50.1208°N
- **Longitude**: 122.9544°W
- **Elevation**: ~675m (village level)

## Customization

### Change Location
Edit `app.js` lines 2-3:
```javascript
const WHISTLER_LAT = 50.1208;
const WHISTLER_LON = -122.9544;
```

### Adjust Update Frequency
Edit `app.js` line 11 (time in milliseconds):
```javascript
setInterval(fetchWeatherData, 600000); // 600000 = 10 minutes
```

### Modify Temperature Units
The app uses Celsius. To change to Fahrenheit, update the API URLs in `app.js` and modify:
```javascript
&temperature_unit=celsius  →  &temperature_unit=fahrenheit
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - feel free to use, modify, and distribute.

## Credits

- **Weather Data**: [Open-Meteo](https://open-meteo.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Icons**: Emoji-based weather symbols (universal support)

## Contributing

Contributions are welcome! Some ideas for enhancements:
- Webcam integration for mountain conditions
- Avalanche risk data integration
- Lift status information
- Trail conditions reports
- Historical weather comparisons
- Dark mode toggle
- Multi-location support

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure you have an internet connection (required for API calls)
3. Try refreshing the page
4. Check if Open-Meteo API is operational: https://open-meteo.com/

## Future Enhancements

Potential features to add:
- [ ] UV index for high-altitude sun exposure
- [ ] Air quality monitoring
- [ ] Detailed precipitation type (wet snow vs powder)
- [ ] Moon phase for night skiing
- [ ] Sunrise/sunset times
- [ ] Historical snow depth graphs
- [ ] Push notifications for powder alerts
- [ ] PWA (Progressive Web App) support for offline access

---

**Built for skiers and snowboarders by weather enthusiasts**

Enjoy the powder! 🏂⛷️❄️
