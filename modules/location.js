
const superagent = require('superagent');
const pg = require('pg');
const errorHandler = require('../server.js')
const client = new pg.Client(process.env.DATABASE_URL);
client.on('err', err => { throw err; });

let locations = {};

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


exports.locationHandler = locationHandler;


