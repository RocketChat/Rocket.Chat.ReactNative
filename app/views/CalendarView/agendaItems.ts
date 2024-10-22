import isEmpty from 'lodash/isEmpty';

const today = new Date().toISOString().split('T')[0];
const fastDate = getPastDate(3);
const futureDates = getFutureDates(12);
const dates = [fastDate, today].concat(futureDates);

function getFutureDates(numberOfDays: number) {
	const array: string[] = [];
	for (let index = 1; index <= numberOfDays; index++) {
		let d = Date.now();
		if (index > 8) {
			// set dates on the next month
			const newMonth = new Date(d).getMonth() + 1;
			d = new Date(d).setMonth(newMonth);
		}
		const date = new Date(d + 864e5 * index); // 864e5 == 86400000 == 24*60*60*1000
		const dateString = date.toISOString().split('T')[0];
		array.push(dateString);
	}
	return array;
}
function getPastDate(numberOfDays: number) {
	return new Date(Date.now() - 864e5 * numberOfDays).toISOString().split('T')[0];
}

export const agendaItems = [
	{
		title: dates[0],
		data: [
			{ title: 'Happy Hour', date: dates[0], isZoom: true, users: [{ username: 'timq' }, { username: 'abigaildemian' }] },
			{ title: 'Meet & Greet', date: dates[0], isZoom: true, users: [{ username: 'timq' }] },
			{
				title: 'Happy Hour',
				date: dates[0],
				isZoom: true,
				users: [{ username: 'timq' }, { username: 'yipannie' }, { username: 'alaana.s' }]
			}
		]
	},
	{
		title: dates[1],
		data: [{ title: 'Meet & Greet', date: dates[1], isZoom: true, users: [{ username: 'timq' }] }]
	},
	{
		title: dates[2],
		data: [
			{ title: 'Happy Hour', date: dates[2], isZoom: true, users: [{ username: 'timq' }, { username: 'abigaildemian' }] },
			{ title: 'Meet & Greet', date: dates[2], isZoom: true, users: [{ username: 'timq' }] },
			{
				title: 'Happy Hour',
				date: dates[2],
				isZoom: true,
				users: [{ username: 'timq' }, { username: 'yipannie' }, { username: 'alaana.s' }]
			}
		]
	},
	{
		title: dates[3],
		data: [{ title: 'Meet & Greet', date: dates[3], isZoom: true, users: [{ username: 'timq' }] }]
	},
	{
		title: dates[4],
		data: [
			{ title: 'Happy Hour', date: dates[4], isZoom: true, users: [{ username: 'timq' }, { username: 'abigaildemian' }] },
			{ title: 'Meet & Greet', date: dates[4], isZoom: true, users: [{ username: 'timq' }] },
			{
				title: 'Happy Hour',
				date: dates[4],
				isZoom: true,
				users: [{ username: 'timq' }, { username: 'yipannie' }, { username: 'alaana.s' }]
			}
		]
	},
	{
		title: dates[5],
		data: [{ title: 'Meet & Greet', date: dates[5], isZoom: true, users: [{ username: 'timq' }] }]
	}
];

export function getMarkedDates(agendaItems) {
	const marked: any = {};

	agendaItems.forEach(item => {
		// NOTE: only mark dates with data
		if (item.data && item.data.length > 0 && !isEmpty(item.data[0])) {
			marked[item.title] = { marked: true };
		} else {
			marked[item.title] = { disabled: true };
		}
	});
	return marked;
}
