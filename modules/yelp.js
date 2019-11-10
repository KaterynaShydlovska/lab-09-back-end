
const superagent = require('superagent');
const errorHandler = require('../server.js')

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
}

exports.yelpHandler = yelpHandler;