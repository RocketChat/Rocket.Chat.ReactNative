import log from '../../utils/log';
import updateMessages from './updateMessages';

const COUNT = 50;

export default function loadSurroundingMessages({ messageId, rid }) {
  console.log('🚀 ~ file: loadSurroundingMessages.js ~ line 7 ~ loadSurroundingMessages ~ messageId, rid', messageId, rid);
	return new Promise(async(resolve, reject) => {
		try {
			const data = await this.methodCallWrapper('loadSurroundingMessages', { _id: messageId, rid });
      console.log('🚀 ~ file: loadSurroundingMessages.js ~ line 11 ~ returnnewPromise ~ data', data);
			const messages = data?.messages;
			if (messages?.length) {
				if (data?.moreBefore) {
					const lastMessage = messages[messages.length - 1];
					const dummy = {
						_id: `dummy-${ lastMessage._id }`,
						rid: lastMessage.rid,
						ts: lastMessage.ts,
						t: 'dummy'
					};
					messages.push(dummy);
				}

				if (data?.moreAfter) {
					const firstMessage = messages[messages.length - 1];
					const dummy = {
						_id: `dummy-${ firstMessage._id }`,
						rid: firstMessage.rid,
						ts: firstMessage.ts,
						t: 'dummy'
					};
					messages.unshift(dummy);
				}
				console.log('🚀 ~ file: loadSurroundingMessages.js ~ line 39 ~ returnnewPromise ~ data', messages);
				await updateMessages({ rid, update: messages });
				return resolve(messages);
			} else {
				return resolve([]);
			}
		} catch (e) {
			log(e);
			reject(e);
		}
	});
}
