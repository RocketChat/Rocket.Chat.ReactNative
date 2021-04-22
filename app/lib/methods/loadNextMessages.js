import log from '../../utils/log';
import updateMessages from './updateMessages';

const COUNT = 50;

export default function loadNextMessages(args) {
	return new Promise(async(resolve, reject) => {
		try {
			const data = await this.methodCallWrapper('loadNextMessages', args.rid, args.ts, COUNT);
			// const messages = EJSON.parse(data?.messages);
      console.log('🚀 ~ file: loadNextMessages.js ~ line 10 ~ returnnewPromise ~ data', data);
			// if (data?.length) {
			// 	const lastMessage = data[data.length - 1];
			// 	const dummy = {
			// 		_id: `dummy-${ lastMessage._id }`,
			// 		rid: lastMessage.rid,
			// 		ts: lastMessage.ts,
			// 		t: 'dummy'
			// 	};
			// 	if (data.length === 50) {
			// 		data.push(dummy);
			// 	}
			// 	await updateMessages({ rid: args.rid, update: data, item: args.item });
			// 	return resolve(data);
			// } else {
			// 	return resolve([]);
			// }
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
