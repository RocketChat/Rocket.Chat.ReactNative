export default function(obj) {
	return Object.keys(obj).map(p => `${ encodeURIComponent(p) }=${ encodeURIComponent(obj[p]) }`).join('&');
}
