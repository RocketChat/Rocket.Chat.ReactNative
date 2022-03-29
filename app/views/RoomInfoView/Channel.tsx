import React from 'react';

import I18n from '../../i18n';
import { ISubscription } from '../../definitions';
import Item from './Item';

const Channel = ({ room }: { room: ISubscription }) => {
	const { description, topic, announcement } = room;
	return (
		<>
			<Item
				label={I18n.t('Description')}
				content={description || `__${I18n.t('No_label_provided', { label: 'description' })}__`}
				testID='room-info-view-description'
			/>
			<Item
				label={I18n.t('Topic')}
				content={topic || `__${I18n.t('No_label_provided', { label: 'topic' })}__`}
				testID='room-info-view-topic'
			/>
			<Item
				label={I18n.t('Announcement')}
				content={announcement || `__${I18n.t('No_label_provided', { label: 'announcement' })}__`}
				testID='room-info-view-announcement'
			/>
			<Item
				label={I18n.t('Broadcast_Channel')}
				content={room.broadcast ? I18n.t('Broadcast_channel_Description') : ''}
				testID='room-info-view-broadcast'
			/>
		</>
	);
};

export default Channel;
