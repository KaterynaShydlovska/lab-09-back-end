'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');
const pg = require('pg');

// Application Setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => { throw err; });

let locations = {};

// Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.get('/movies', movieHandler);
app.get('/yelp', yelpHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);


function locationHandler(request, response) {
  let value = [request.query.data];
  let SQL = `SELECT * FROM location WHERE location_name = $1`;
  client.query(SQL, value)
    .then(results => {
      if (results.rowCount) {
        // console.log(results.rowCount);
        response.status(200).json(results.rows[0]);
      } else {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${request.query.data}&key=${process.env.GEOCODE_API_KEY}`;
        superagent.get(url)
          .then(data => {
            const geoData = data.body;
            const location = new Location(request.query.data, geoData);
            // console.log(location);
            locations[url] = location;
            let locationName = location.search_query;
            let formatted_query = location.formatted_query;
            let latitude = location.latitude;
            let longitude = location.longitude;
            console.log(locationName, latitude, longitude);
            let SQL = `INSERT INTO location (location_name, formatted_query, latitude, longitude ) VALUES ($1, $2, $3, $4) RETURNING *`;
            let safeValues = [locationName, formatted_query, latitude, longitude];
            client.query(SQL, safeValues)
              .then(results => {
                response.status(200).json(results);
                // console.log(`added new localion ${results}`);
              })
              .catch(err => console.error(err));
            // response.send(location);
          })
          .catch(() => {
            errorHandler('So sorry, something went wrong.', request, response);
          });
      }
    });
}

function Location(query, geoData) {
  this.search_query = query;
  this.formatted_query = geoData.results[0].formatted_address;
  this.latitude = geoData.results[0].geometry.location.lat;
  this.longitude = geoData.results[0].geometry.location.lng;
}

function weatherHandler(request, response) {

  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;

  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day => {
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch(() => {
      errorHandler('So sorry, something went wrong.', request, response);
    });

}

function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}


// https://www.hikingproject.com/data/get-trails?lat=40.0274&lon=-105.2519&maxDistance=10&key=200632717-2cb4e4ee4b4db951e56453ae07aff93a
function trailsHandler(request, response) {
  const url = `https://www.hikingproject.com/data/get-trails?lat=${request.query.data.latitude}&lon=${request.query.data.longitude}&maxDistance=10&key=${process.env.TRAIL_API_KEY}`;
  superagent.get(url)
    .then(data => {
      // console.log(data.body.trails);
      const trailsData = data.body.trails.map(trail => {
        return new Trail(trail);
      });
      response.status(200).json(trailsData);
    })
    .catch(() => {
      errorHandler('So sorry, something went wrong.', request, response);
    });

}

function Trail(trails) {
  this.name = trails.name;
  this.location = trails.location;
  this.length = trails.length;
  this.stars = trails.stars;
  this.star_votes = trails.starVotes;
  this.summary = trails.summary;
  this.trail_url = trails.url;
  this.conditions = trails.conditionStatus;
  this.condition_date = trails.conditionDate;
  // this.condition_time = trails.
}


//https://api.themoviedb.org/3/movie/550?api_key=24d107d7d3041491d0272c0aff0c5b70
//https://image.tmdb.org/t/p/w500/8uO0gUM8aNqYLs1OsTBQiXu0fEv.jpg

function Movie(movie) {
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
  // console.log('PASTRAMIII', this);
}

function movieHandler(request, response) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.MOVIE_API_KEY}&language=en-US&page=1`;
  superagent.get(url)
    .then(data => {
      let movies = [];
      for (let i=0; i < 20; i++){
        movies.push(new Movie(data.body.results[i]));
      }
      response.status(200).json(movies);

    })
    .catch(() => {
      errorHandler('So sorry, something went wrong.', request, response);
    });

}

//https://api.yelp.com/v3/businesses/search

function yelpHandler(request, response) {
  const url = `https://api.yelp.com/v3/businesses/search?latitude=${request.query.data.latitude}&longitude=${request.query.data.longitude}`;
  superagent.get(url)
    .set(`Authorization`, `Bearer ${process.env.YELP_API_KEY}`)
    .then(data => {
      // console.log(data.body.yelp);
      const yelpData = data.body.businesses.map(business => {
        return new Yelp(business);
      });
      response.status(200).json(yelpData);
    })
    .catch(() => {
      errorHandler('So sorry, something went wrong.', request, response);
    });
}
function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
  // console.log('PASTRAMIII', this);
}





function notFoundHandler(request, response) {
  response.status(404).send('huh?');
}

function errorHandler(error, request, response) {
  response.status(500).send(error);
}

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`listening on ${PORT}`);
    })
  })
  .catch(err => {
    throw `PG startup error ${err.message}`;
  })
