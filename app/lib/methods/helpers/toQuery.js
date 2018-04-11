export default function(obj) {
	return Object.keys(obj).filter(p => obj[p] !== undefined).map(p => `${ encodeURIComponent(p) }=${ encodeURIComponent(obj[p]) }`).join('&');
}
