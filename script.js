// script.js

const API_KEY = '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Function to fetch weather data
async function fetchWeather(city) {
    try {
        if (!city) {
            alert('Please enter a city name.');
            return;
        }

        const unit = getTemperatureUnit(); // Retrieve the saved temperature unit
        const response = await fetch(`${BASE_URL}?q=${city}&units=${unit}&appid=${API_KEY}`);

        if (!response.ok) {
            alert('City not found. Please try again.'); // Display an error alert
            document.querySelector('#city-input').value = ''; // Clear the input field
            return; // Prevent redirect to the error page
        }

        const data = await response.json();
        localStorage.setItem('weatherData', JSON.stringify(data)); // Store data locally
        window.location.href = 'CurrentWeather.html'; // Redirect to weather page
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert('An error occurred. Please try again.'); // Handle API/network errors
        document.querySelector('#city-input').value = ''; // Clear the input field
    }
}

// Event listener for search button
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('#city-input');
    const searchButton = document.querySelector('.search-button');

    if (searchInput && searchButton) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                fetchWeather(searchInput.value.trim());
            }
        });

        searchButton.addEventListener('click', () => {
            fetchWeather(searchInput.value.trim());
        });
    }
});

// Function to display weather data on CurrentWeather.html
let autoRefreshInitialized = false;

function displayWeather() {
    const weatherData = localStorage.getItem('weatherData');

    if (!weatherData) {
        window.location.href = 'ErrorScreen.html'; // Redirect if no data is available
        return;
    }

    const data = JSON.parse(weatherData);

    // Get the saved temperature unit and corresponding symbol
    const unit = getTemperatureUnit(); // Either 'metric' or 'imperial'
    const unitSymbol = unit === 'metric' ? '°C' : '°F';

    // Display data, ensuring no duplicate symbols
    if (document.getElementById('city-name')) {
        document.getElementById('city-name').textContent = data.name;
    }
    if (document.getElementById('temperature')) {
        const temperature = Math.round(data.main.temp); // Ensure it's just a number
        document.getElementById('temperature').textContent = `${temperature}${unitSymbol}`;
    }
    if (document.getElementById('weather-description')) {
        document.getElementById('weather-description').textContent = data.weather[0].description;
    }
    if (document.getElementById('humidity')) {
        document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    }
    if (document.getElementById('wind-speed')) {
        document.getElementById('wind-speed').textContent = `${data.wind.speed} km/h`;
    }
}

// Run displayWeather() when CurrentWeather.html loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.title.includes('Current Weather')) {
        displayWeather();
    }
});

// Function to fetch 5-day weather forecast
async function fetchForecast(city) {
    try {
        const unit = getTemperatureUnit(); // Get saved unit
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
        }

        const data = await response.json();
        localStorage.setItem('forecastData', JSON.stringify(data)); // Store forecast data

        // Ensure the data is saved before redirecting
        setTimeout(() => {
            window.location.href = 'WeeklyForecast.html'; // Redirect to forecast page
        }, 500);
    } catch (error) {
        console.error('Error fetching forecast:', error);
        alert('Failed to fetch forecast data. Please try again.');
        window.location.href = 'ErrorScreen.html'; // Redirect to error page
    }
}

// Update the button in CurrentWeather.html to call fetchForecast()
document.addEventListener('DOMContentLoaded', () => {
    const forecastButton = document.querySelector('.forecast-button');
    if (forecastButton) {
        forecastButton.addEventListener('click', () => {
            const weatherData = JSON.parse(localStorage.getItem('weatherData'));
            if (weatherData) {
                fetchForecast(weatherData.name); // Fetch forecast based on the stored city name
            } else {
                alert("No city found. Please enter a city and search again.");
            }
        });
    }
});

// Function to display 5-day forecast
function displayForecast() {
    const forecastData = localStorage.getItem('forecastData');

    if (!forecastData) {
        window.location.href = 'ErrorScreen.html'; // Redirect if no data is available
        return;
    }

    const data = JSON.parse(forecastData);
    const forecastTable = document.querySelector('#forecast-table tbody');

    if (!forecastTable) {
        console.error('Forecast table not found!');
        return;
    }

    forecastTable.innerHTML = ''; // Clear previous rows

    const unit = getTemperatureUnit();
    const unitSymbol = unit === 'metric' ? '°C' : '°F';
    
    // Group data by day
    const dailyData = {};
    data.list.forEach(item => {
        const date = new Date(item.dt_txt).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dailyData[date]) {
            dailyData[date] = [];
        }
        dailyData[date].push(item);
    });

    // Process each day's data to find high, low, and dominant condition
    Object.keys(dailyData).forEach(day => {
        const dayData = dailyData[day];
        let highTemp = -Infinity;
        let lowTemp = Infinity;

        const conditionCounts = {};
        let dominantCondition = '';
        let dominantIcon = '';

        dayData.forEach(entry => {
            highTemp = Math.max(highTemp, entry.main.temp_max || entry.main.temp);
            lowTemp = Math.min(lowTemp, entry.main.temp_min || entry.main.temp);

            const condition = entry.weather[0].description;
            const icon = entry.weather[0].icon;

            // Count occurrences of each condition
            if (!conditionCounts[condition]) {
                conditionCounts[condition] = { count: 0, icon: icon };
            }
            conditionCounts[condition].count++;

            // Update dominant condition
            if (
                !dominantCondition ||
                conditionCounts[condition].count > conditionCounts[dominantCondition].count
            ) {
                dominantCondition = condition;
                dominantIcon = icon;
            }
        });

        const iconUrl = `http://openweathermap.org/img/wn/${dominantIcon}.png`;

        // Create a table row
        const row = `
            <tr>
                <td>${day}</td>
                <td>${Math.round(highTemp)}${unitSymbol}</td>
                <td>${Math.round(lowTemp)}${unitSymbol}</td>
                <td>
                    <img src="${iconUrl}" alt="${dominantCondition}" title="${dominantCondition}" />
                    ${dominantCondition}
                </td>
            </tr>
        `;
        forecastTable.innerHTML += row;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.title.includes('Current Weather')) {
        displayWeather();
    }
    if (document.title.includes('5-Day Forecast')) {
        displayForecast();
    }

    const saveButton = document.getElementById('save-preferences');
    const unitSelector = document.getElementById('temperature-unit'); // Dropdown for unit selection

    if (saveButton && unitSelector) {
        // Load saved preference
        const savedUnit = localStorage.getItem('temperatureUnit') || 'metric';
        unitSelector.value = savedUnit;

        // Save preference on button click
        saveButton.addEventListener('click', () => {
            const selectedUnit = unitSelector.value;
            localStorage.setItem('temperatureUnit', selectedUnit);
            alert('Preferences saved!');
        });
    }
});



// Retrieve unit preference
function getTemperatureUnit() {
    return localStorage.getItem('temperatureUnit') || 'metric';
}

// Function to fetch city suggestions using OpenWeatherMap API
async function fetchCitySuggestions(query) {
    if (!query) return; // Exit if query is empty

    const API_KEY = '';
    const BASE_URL = 'https://api.openweathermap.org/data/2.5/find';

    try {
        // Call OpenWeatherMap's "Find" endpoint to get city suggestions
        const response = await fetch(`${BASE_URL}?q=${query}&type=like&appid=${API_KEY}`);

        if (!response.ok) {
            console.error('Error fetching city suggestions');
            return;
        }

        const data = await response.json();
        displaySuggestions(data.list); // Pass city results to the display function
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to display suggestions in the dropdown
function displaySuggestions(cities) {
    const resultsList = document.getElementById('autocomplete-results');
    resultsList.innerHTML = ''; // Clear previous suggestions

    if (cities.length === 0) {
        // If no results, show a "No matches found" message
        const li = document.createElement('li');
        li.textContent = 'No matches found';
        li.classList.add('no-results'); // Apply CSS class for styling
        resultsList.appendChild(li);
        return;
    }

    // Populate the dropdown with matching cities
    cities.forEach(city => {
        const li = document.createElement('li');
        li.textContent = `${city.name}, ${city.sys.country}`; // Example: "Toronto, CA"
        li.addEventListener('click', () => {
            // Set the selected city in the input field
            document.getElementById('city-input').value = city.name;
            resultsList.innerHTML = ''; // Clear the suggestions after selection
        });
        resultsList.appendChild(li);
    });
}

// Attach event listener to the city input field
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    if (cityInput) {
        cityInput.addEventListener('input', (event) => {
            const query = event.target.value.trim(); // Get the user's input
            if (query.length > 1) {
                fetchCitySuggestions(query); // Fetch suggestions for input longer than 1 character
            }
        });
    }
});

// Hide dropdown when clicking outside
document.addEventListener('click', (event) => {
    const resultsList = document.getElementById('autocomplete-results');
    const cityInput = document.getElementById('city-input');

    if (!cityInput.contains(event.target) && !resultsList.contains(event.target)) {
        resultsList.innerHTML = ''; // Hide suggestions when clicking outside
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('reset-data');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm("Are you sure you want to erase all weather data? This action cannot be undone.")) {
                localStorage.clear();
                alert('All data has been reset.');
                window.location.reload(); // Reload the page to reflect changes
            }
        });
    }
});
