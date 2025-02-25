import React from 'react';
import { View } from 'react-native';

import MessageContext from '../../../Context';
import CollapsibleQuote from '.';

const testAttachment = {
	ts: '1970-01-01T00:00:00.000Z',
	title: 'Engineering (9 today)',
	fields: [
		{
			title: 'Out Today:\n',
			value:
				'Ricardo Mellu, 1 day, until Fri Mar 11\nLoma, 1 day, until Fri Mar 11\nAnitta, 3 hours\nDiego Carlitos, 19 days, until Fri Mar 11\nGabriel Vasconcelos, 5 days, until Fri Mar 11\nJorge Leite, 1 day, until Fri Mar 11\nKevin Aleman, 1 day, until Fri Mar 11\nPierre, 1 day, until Fri Mar 11\nTiago Evangelista Pinto, 1 day, until Fri Mar 11'
		}
	],
	attachments: [],
	collapsed: true
};

export default {
	title: 'CollapsibleQuote'
};

export const Item = () => (
	<View style={{ padding: 10 }}>
		<MessageContext.Provider
			value={{
				onLongPress: () => {},
				user: { username: 'Marcos' }
			}}>
			<CollapsibleQuote key={0} index={0} attachment={testAttachment} getCustomEmoji={() => null} timeFormat='LT' />
		</MessageContext.Provider>
	</View>
);
