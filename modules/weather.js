const superagent = require('superagent');
const errorHandler = require('../server.js')


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

exports.weatherHandler = weatherHandler;
