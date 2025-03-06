import moment from 'moment';
import React from 'react';

import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks';
import Item from './Item';

const Timezone = ({ utcOffset }: { utcOffset?: number }): React.ReactElement | null => {
	const Message_TimeFormat = useAppSelector(state => state.settings.Message_TimeFormat as string);

	if (!utcOffset) return null;

	return (
		<Item label={I18n.t('Timezone')} content={`${moment().utcOffset(utcOffset).format(Message_TimeFormat)} (UTC ${utcOffset})`} />
	);
};

export default Timezone;
