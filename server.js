'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const weather = require('./modules/weather.js');
const trail = require('./modules/hiking.js');
const movie = require('./modules/movies.js');
const yelp = require('./modules/yelp.js');
const location = require('./modules/location.js');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => { throw err; });

// Route Definitions
app.get('/location', location.locationHandler);
app.get('/weather', weather.weatherHandler);
app.get('/trails', trail.trailsHandler);
app.get('/movies', movie.movieHandler);
app.get('/yelp', yelp.yelpHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);


function notFoundHandler(request, response) {
  response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
