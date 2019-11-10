
const superagent = require('superagent');
const errorHandler = require('../server.js')

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

exports.trailsHandler = trailsHandler;
