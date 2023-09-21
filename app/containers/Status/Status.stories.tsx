import React from 'react';

import Status from './Status';

export default {
	title: 'Status'
};

export const All = () => (
	<>
		<Status status='online' />
		<Status status='busy' />
		<Status status='away' />
		<Status status='loading' />
		<Status status='disabled' />
		<Status status='offline' />
		<Status />
		<Status status='online' size={60} />
	</>
);
