// Wait for the DOM to be fully loaded before running script
document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    const stockForm = document.getElementById('stockForm');
    const stockData = document.getElementById('stockData');
    const errorDiv = document.getElementById('error');
    const formError = document.getElementById('formError');
    const loadingDiv = document.getElementById('loading');

    // Add event listener to the form
    stockForm.addEventListener('submit', fetchStockData);

    /**
     * Fetches stock data from Alpha Vantage API based on form inputs
     * @param {Event} event - The form submission event
     */
    function fetchStockData(event) {
        // Prevent the default form submission
        event.preventDefault();

        // Clear any previous data and errors
        stockData.innerHTML = '';
        errorDiv.textContent = '';
        formError.textContent = '';

        // Get form values
        const symbol = document.getElementById('symbolInput').value.trim().toUpperCase();
        const functionType = document.getElementById('functionSelect').value;
        const apiKey = document.getElementById('apiKeyInput').value.trim();

        // Validate form data
        if (!symbol || !apiKey) {
            formError.textContent = 'Please enter both a stock symbol and your API key.';
            return;
        }

        // Show loading indicator
        loadingDiv.style.display = 'block';

        // Construct the API URL
        const apiUrl = `https://www.alphavantage.co/query?function=${functionType}&symbol=${symbol}&apikey=${apiKey}`;

        // Make the fetch request
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Hide loading indicator
                loadingDiv.style.display = 'none';
                
                // Check for API error messages
                if (data.hasOwnProperty('Error Message')) {
                    throw new Error(data['Error Message']);
                }
                
                if (data.hasOwnProperty('Note')) {
                    // This typically means API call frequency exceeded
                    errorDiv.textContent = data.Note;
                }
                
                // Display the data based on function type
                displayStockData(data, functionType, symbol);
            })
            .catch(error => {
                // Hide loading indicator
                loadingDiv.style.display = 'none';
                
                // Display error message
                errorDiv.textContent = `Error: ${error.message}`;
            });
    }

    /**
     * Displays stock data in the UI based on function type
     * @param {Object} data - The response data from Alpha Vantage
     * @param {String} functionType - The type of function/endpoint used
     * @param {String} symbol - The stock symbol queried
     */
    function displayStockData(data, functionType, symbol) {
        // Create container for data
        const container = document.createElement('div');
        container.className = 'stock-data';
        
        // Handle different function types
        switch (functionType) {
            case 'GLOBAL_QUOTE':
                displayGlobalQuote(data, container, symbol);
                break;
            case 'TIME_SERIES_DAILY':
                displayTimeSeries(data, container, symbol);
                break;
            case 'OVERVIEW':
                displayCompanyOverview(data, container, symbol);
                break;
            default:
                container.innerHTML = '<p>Unsupported data type</p>';
        }
        
        // Add the data to the page
        stockData.appendChild(container);
    }

    /**
     * Displays global quote data
     */
    function displayGlobalQuote(data, container, symbol) {
        // Check if we have the expected data
        if (!data['Global Quote']) {
            container.innerHTML = `<p>No quote data available for ${symbol}</p>`;
            return;
        }
        
        const quote = data['Global Quote'];
        
        container.innerHTML = `
            <h3>${symbol} - Current Quote</h3>
            <table>
                <tr><th>Price</th><td>${quote['05. price']}</td></tr>
                <tr><th>Open</th><td>${quote['02. open']}</td></tr>
                <tr><th>High</th><td>${quote['03. high']}</td></tr>
                <tr><th>Low</th><td>${quote['04. low']}</td></tr>
                <tr><th>Volume</th><td>${quote['06. volume']}</td></tr>
                <tr><th>Latest Trading Day</th><td>${quote['07. latest trading day']}</td></tr>
                <tr><th>Previous Close</th><td>${quote['08. previous close']}</td></tr>
                <tr><th>Change</th><td>${quote['09. change']}</td></tr>
                <tr><th>Change Percent</th><td>${quote['10. change percent']}</td></tr>
            </table>
        `;
    }

    /**
     * Displays time series data
     */
    function displayTimeSeries(data, container, symbol) {
        // Check if we have the expected data
        const timeSeriesKey = 'Time Series (Daily)';
        if (!data[timeSeriesKey]) {
            container.innerHTML = `<p>No time series data available for ${symbol}</p>`;
            return;
        }
        
        const timeSeries = data[timeSeriesKey];
        const dates = Object.keys(timeSeries).slice(0, 10); // Get the 10 most recent dates
        
        let tableHTML = `
            <h3>${symbol} - Daily Time Series (Last 10 Days)</h3>
            <table>
                <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Volume</th>
                </tr>
        `;
        
        dates.forEach(date => {
            const dayData = timeSeries[date];
            tableHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${dayData['1. open']}</td>
                    <td>${dayData['2. high']}</td>
                    <td>${dayData['3. low']}</td>
                    <td>${dayData['4. close']}</td>
                    <td>${dayData['5. volume']}</td>
                </tr>
            `;
        });
        
        tableHTML += '</table>';
        container.innerHTML = tableHTML;
    }

    /**
     * Displays company overview data
     */
    function displayCompanyOverview(data, container, symbol) {
        // Check if we have data (no specific key to check, but Name should exist)
        if (!data.Name) {
            container.innerHTML = `<p>No company overview available for ${symbol}</p>`;
            return;
        }
        
        container.innerHTML = `
            <h3>${data.Name} (${data.Symbol}) - Company Overview</h3>
            <table>
                <tr><th>Exchange</th><td>${data.Exchange}</td></tr>
                <tr><th>Industry</th><td>${data.Industry}</td></tr>
                <tr><th>Sector</th><td>${data.Sector}</td></tr>
                <tr><th>Market Cap</th><td>${data.MarketCapitalization}</td></tr>
                <tr><th>P/E Ratio</th><td>${data.PERatio}</td></tr>
                <tr><th>Dividend Yield</th><td>${data.DividendYield}</td></tr>
                <tr><th>52 Week High</th><td>${data['52WeekHigh']}</td></tr>
                <tr><th>52 Week Low</th><td>${data['52WeekLow']}</td></tr>
                <tr><th>Description</th><td>${data.Description}</td></tr>
            </table>
        `;
    }
});