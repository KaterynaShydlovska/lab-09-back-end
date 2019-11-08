
const superagent = require('superagent');
const errorHandler = require('../server.js')

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
      for (let i = 0; i < 20; i++) {
        movies.push(new Movie(data.body.results[i]));
      }
      response.status(200).json(movies);

    })
    .catch(() => {
      errorHandler('So sorry, something went wrong.', request, response);
    });

}

exports.movieHandler = movieHandler;