export default function(obj) {
	return Object.keys(obj).filter(p => obj[p] !== undefined && obj[p] !== null).map(p => `${ encodeURIComponent(p) }=${ encodeURIComponent(obj[p]) }`).join('&');
}
