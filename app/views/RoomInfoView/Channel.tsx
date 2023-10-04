import React from 'react';

import I18n from '../../i18n';
import { ISubscription } from '../../definitions';
import Item from './Item';

const Channel = ({ room }: { room?: ISubscription }): React.ReactElement => {
	const description = room?.description || `__${I18n.t('No_label_provided', { label: 'description' })}__`;
	const topic = room?.topic || `__${I18n.t('No_label_provided', { label: 'topic' })}__`;
	const announcement = room?.announcement || `__${I18n.t('No_label_provided', { label: 'announcement' })}__`;
	const broadcast = room?.broadcast ? I18n.t('Broadcast_hint') : '';
	return (
		<>
			<Item label={I18n.t('Description')} content={description} testID='room-info-view-description' />
			<Item label={I18n.t('Topic')} content={topic} testID='room-info-view-topic' />
			<Item label={I18n.t('Announcement')} content={announcement} testID='room-info-view-announcement' />
			<Item label={I18n.t('Broadcast')} content={broadcast} testID='room-info-view-broadcast' />
		</>
	);
};

export default Channel;
