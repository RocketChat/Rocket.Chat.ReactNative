import React from 'react';

import { OmnichannelSourceType } from '../../definitions';
import RoomTypeIcon from '.';

export default {
	title: 'RoomTypeIcon'
};

export const All = () => (
	<>
		<RoomTypeIcon size={30} type='d' userId='asd' />
		<RoomTypeIcon size={30} type='d' userId='asd' status='online' />
		<RoomTypeIcon size={30} type='d' isGroupChat />
		<RoomTypeIcon size={30} type='c' />
		<RoomTypeIcon size={30} type='p' />
		<RoomTypeIcon size={30} type='c' teamMain />
		<RoomTypeIcon size={30} type='p' teamMain />
		<RoomTypeIcon size={30} type='discussion' />
		<RoomTypeIcon size={30} type='l' status='away' sourceType={{ type: OmnichannelSourceType.SMS }} />
		<RoomTypeIcon size={30} type='p' style={{ margin: 10 }} />
	</>
);
