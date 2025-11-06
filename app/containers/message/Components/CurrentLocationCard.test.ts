import { extractCoordsFromMessage } from './CurrentLocationCard';

describe('extractCoordsFromMessage', () => {
	it('parses geo:lat,lon', () => {
		expect(extractCoordsFromMessage('geo:37.7749,-122.4194')).toEqual({
			latitude: 37.7749,
			longitude: -122.4194
		});
	});

	it('parses geo:0,0?q=lat,lon', () => {
		expect(extractCoordsFromMessage('geo:0,0?q=40.7128,-74.0060')).toEqual({
			latitude: 40.7128,
			longitude: -74.0060
		});
		expect(extractCoordsFromMessage('geo:0,0?q=40.7128%2C-74.0060')).toEqual({
			latitude: 40.7128,
			longitude: -74.0060
		});
	});

	it('parses Apple Maps ll param', () => {
		expect(extractCoordsFromMessage('https://maps.apple.com/?ll=51.5074,-0.1278')).toEqual({
			latitude: 51.5074,
			longitude: -0.1278
		});
	});

	it('parses Apple Maps q param', () => {
		expect(extractCoordsFromMessage('https://maps.apple.com/?q=48.8566,2.3522')).toEqual({
			latitude: 48.8566,
			longitude: 2.3522
		});
	});

	it('parses comgooglemaps://?q=lat,lon', () => {
		expect(extractCoordsFromMessage('comgooglemaps://?q=34.0522,-118.2437')).toEqual({
			latitude: 34.0522,
			longitude: -118.2437
		});
		expect(extractCoordsFromMessage('comgooglemaps://?q=34.0522%2C-118.2437')).toEqual({
			latitude: 34.0522,
			longitude: -118.2437
		});
	});

	it('parses google.com/maps/?q=lat,lon', () => {
		expect(extractCoordsFromMessage('https://www.google.com/maps/?q=35.6895,139.6917')).toEqual({
			latitude: 35.6895,
			longitude: 139.6917
		});
		expect(extractCoordsFromMessage('https://www.google.com/maps/?q=35.6895%2C139.6917')).toEqual({
			latitude: 35.6895,
			longitude: 139.6917
		});
	});

	it('parses google.com/maps/@lat,lon,zoom', () => {
		expect(extractCoordsFromMessage('https://www.google.com/maps/@55.7558,37.6173,15z')).toEqual({
			latitude: 55.7558,
			longitude: 37.6173
		});
	});

	it('parses openstreetmap.org/?mlat=lat&mlon=lon', () => {
		expect(extractCoordsFromMessage('https://www.openstreetmap.org/?mlat=52.52&mlon=13.405')).toEqual({
			latitude: 52.52,
			longitude: 13.405
		});
	});

	it('parses openstreetmap.org/#map=z/lat/lon', () => {
		expect(extractCoordsFromMessage('https://www.openstreetmap.org/#map=12/41.9028/12.4964')).toEqual({
			latitude: 41.9028,
			longitude: 12.4964
		});
	});

	it('returns null for non-location messages', () => {
		expect(extractCoordsFromMessage('Hello world!')).toBeNull();
		expect(extractCoordsFromMessage('')).toBeNull();
		expect(extractCoordsFromMessage(undefined)).toBeNull();
	});

	describe('geo: robustness', () => {
		it('handles extra query params in geo:', () => {
			expect(extractCoordsFromMessage('geo:0,0?q=51.5,0.12&zoom=14')).toEqual({
				latitude: 51.5,
				longitude: 0.12
			});
		});

		it('supports signed coordinates', () => {
			expect(extractCoordsFromMessage('geo:+12.3456,-098.7654')).toEqual({
				latitude: 12.3456,
				longitude: -98.7654
			});
		});
	});

	describe('Apple Maps robustness', () => {
		it('works with additional params / param reordering', () => {
			expect(
				extractCoordsFromMessage('https://maps.apple.com/?t=m&foo=bar&ll=35.6762,139.6503&z=12')
			).toEqual({
				latitude: 35.6762,
				longitude: 139.6503
			});
			expect(
				extractCoordsFromMessage('https://maps.apple.com/?t=m&q=34.6937,135.5023&foo=bar')
			).toEqual({
				latitude: 34.6937,
				longitude: 135.5023
			});
		});

		it('handles whitespace around URLs', () => {
			expect(extractCoordsFromMessage('  https://maps.apple.com/?ll=10.1,20.2  ')).toEqual({
				latitude: 10.1,
				longitude: 20.2
			});
		});
	});

	describe('Google Maps – web variants', () => {
		it('parses center= and query=', () => {
			expect(extractCoordsFromMessage('https://www.google.com/maps/?center=52.52,13.405')).toEqual({
				latitude: 52.52,
				longitude: 13.405
			});
			expect(extractCoordsFromMessage('https://www.google.com/maps/?query=-23.5505,-46.6333')).toEqual({
				latitude: -23.5505,
				longitude: -46.6333
			});
		});

		it('handles fragments and extra params', () => {
			expect(extractCoordsFromMessage('https://www.google.com/maps/?q=40.4168,-3.7038&foo=bar#frag')).toEqual({
				latitude: 40.4168,
				longitude: -3.7038
			});
		});

		it('supports encoded comma and signed longitude', () => {
			expect(extractCoordsFromMessage('https://www.google.com/maps/?q=-12.5,%2B99.25')).toEqual({
				latitude: -12.5,
				longitude: 99.25
			});
		});
	});

	describe('Google Maps – app scheme', () => {
		it('parses center=lat,lon', () => {
			expect(extractCoordsFromMessage('comgooglemaps://?center=59.3293,18.0686&zoom=12')).toEqual({
				latitude: 59.3293,
				longitude: 18.0686
			});
		});
	});

	describe('OpenStreetMap robustness', () => {
		it('parses with swapped order of mlat/mlon among other params', () => {
			expect(extractCoordsFromMessage('https://www.openstreetmap.org/?foo=bar&mlon=13.405&mlat=52.52')).toEqual({
				latitude: 52.52,
				longitude: 13.405
			});
		});
	});
});
