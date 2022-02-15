// host=open.rocket.chat&path=channel/general/thread/meRK2nfjR99MjLn55
// return is
// {
// 	host: open.rocket.chat,
// 	path: channel/general/thread/meRK2nfjR99MjLn55
// }

export default function (query: string) {
	return (/^[?#]/.test(query) ? query.slice(1) : query).split('&').reduce((params: { [key: string]: string }, param) => {
		const [key, value] = param.split('=');
		params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
		return params;
	}, {});
}
