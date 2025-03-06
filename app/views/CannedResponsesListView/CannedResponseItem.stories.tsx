import React from 'react';

import CannedResponseItem from './CannedResponseItem';

export default {
	title: 'CannedResponseItem'
};

const item = [
	{
		_id: 'x1-x1-x1',
		shortcut: '!FAQ4',
		text: 'ZCVXZVXCZVZXVZXCVZXCVXZCVZX',
		scope: 'user',
		userId: 'xxx-x-xx-x-x-',
		createdBy: {
			_id: 'xxx-x-xx-x-x-',
			username: 'rocket.cat'
		},
		_createdAt: '2021-08-11T01:23:17.379Z',
		_updatedAt: '2021-08-11T01:23:17.379Z',
		scopeName: 'Private'
	},
	{
		_id: 'x1-1x-1x',
		shortcut: 'test4mobilePrivate',
		text: 'test for mobile private',
		scope: 'user',
		tags: ['HQ', 'Closed', 'HQ', 'Problem in Product Y', 'HQ', 'Closed', 'Problem in Product Y'],
		userId: 'laslsaklasal',
		createdBy: {
			_id: 'laslsaklasal',
			username: 'reinaldo.neto'
		},
		_createdAt: '2021-09-02T17:44:52.095Z',
		_updatedAt: '2021-09-02T18:24:40.436Z',
		scopeName: 'Private'
	}
];

const theme = 'light';

export const Itens = () => (
	<>
		<CannedResponseItem
			theme={theme}
			scope={item[0].scopeName}
			shortcut={item[0].shortcut}
			tags={item[0]?.tags}
			text={item[0].text}
			onPressDetail={() => alert('navigation to CannedResponseDetail')}
			onPressUse={() => alert('Back to RoomView and wrote in Message Composer')}
		/>
		<CannedResponseItem
			theme={theme}
			scope={item[1].scopeName}
			shortcut={item[1].shortcut}
			tags={item[1]?.tags}
			text={item[1].text}
			onPressDetail={() => alert('navigation to CannedResponseDetail')}
			onPressUse={() => alert('Back to RoomView and wrote in Message Composer')}
		/>
	</>
);
