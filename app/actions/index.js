import * as types from '../constants/types';
import { APP } from './actionsTypes';

export function appReady() {
	return {
		type: APP.READY
	};
}
export function setCurrentServer(server) {
	return {
		type: types.SET_CURRENT_SERVER,
		payload: server
	};
}

export function setAllSettings(settings) {
	return {
		type: types.SET_ALL_SETTINGS,
		payload: settings
	};
}
export function login() {
	return {
		type: 'LOGIN'
	};
}


// // GENRES
// export function retrieveMoviesGenresSuccess(res) {
// 	return {
// 		type: types.RETRIEVE_MOVIES_GENRES_SUCCESS,
// 		moviesGenres: res.data
// 	};
// }

// export function retrieveMoviesGenres() {
// 	return function (dispatch) {
// 		return axios.get(`${TMDB_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`)
// 		.then(res => {
// 			dispatch(retrieveMoviesGenresSuccess(res));
// 		})
// 		.catch(error => {
// 			console.log(error); //eslint-disable-line
// 		});
// 	};
// }

// // POPULAR
// export function retrievePopularMoviesSuccess(res) {
// 	return {
// 		type: types.RETRIEVE_POPULAR_MOVIES_SUCCESS,
// 		popularMovies: res.data
// 	};
// }

// export function retrievePopularMovies(page) {
// 	return function (dispatch) {
// 		return axios.get(`${TMDB_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`)
// 		.then(res => {
// 			dispatch(retrievePopularMoviesSuccess(res));
// 		})
// 		.catch(error => {
// 			console.log('Popular', error); //eslint-disable-line
// 		});
// 	};
// }

// // NOW PLAYING
// export function retrieveNowPlayingMoviesSuccess(res) {
// 	return {
// 		type: types.RETRIEVE_NOWPLAYING_MOVIES_SUCCESS,
// 		nowPlayingMovies: res.data
// 	};
// }

// export function retrieveNowPlayingMovies(page) {
// 	return function (dispatch) {
// 		return axios.get(`${TMDB_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}`)
// 		.then(res => {
// 			dispatch(retrieveNowPlayingMoviesSuccess(res));
// 		})
// 		.catch(error => {
// 			console.log('Now Playing', error); //eslint-disable-line
// 		});
// 	};
// }

// // MOVIES LIST
// export function retrieveMoviesListSuccess(res) {
// 	return {
// 		type: types.RETRIEVE_MOVIES_LIST_SUCCESS,
// 		list: res.data
// 	};
// }

// export function retrieveMoviesList(type, page) {
// 	return function (dispatch) {
// 		return axios.get(`${TMDB_URL}/movie/${type}?api_key=${TMDB_API_KEY}&page=${page}`)
// 		.then(res => {
// 			dispatch(retrieveMoviesListSuccess(res));
// 		})
// 		.catch(error => {
// 			console.log('Movies List', error); //eslint-disable-line
// 		});
// 	};
// }

// // SEARCH RESULTS
// export function retrieveMoviesSearchResultsSuccess(res) {
// 	return {
// 		type: types.RETRIEVE_MOVIES_SEARCH_RESULT_SUCCESS,
// 		searchResults: res.data
// 	};
// }

// export function retrieveMoviesSearchResults(query, page) {
// 	return function (dispatch) {
// 		return axios.get(`${TMDB_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${query}&page=${page}`)
// 		.then(res => {
// 			dispatch(retrieveMoviesSearchResultsSuccess(res));
// 		})
// 		.catch(error => {
// 			console.log('Movies Search Results', error); //eslint-disable-line
// 		});
// 	};
// }

// // MOVIE DETAILS
// export function retrieveMovieDetailsSuccess(res) {
// 	return {
// 		type: types.RETRIEVE_MOVIE_DETAILS_SUCCESS,
// 		details: res.data
// 	};
// }

// export function retrieveMovieDetails(movieId) {
// 	return function (dispatch) {
// 		return axios.get(`${TMDB_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=casts,images,videos`)
// 		.then(res => {
// 			dispatch(retrieveMovieDetailsSuccess(res));
// 		})
// 		.catch(error => {
// 			console.log('Movie Details', error); //eslint-disable-line
// 		});
// 	};
// }
