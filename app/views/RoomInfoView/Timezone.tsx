import React from 'react';

import dayjs from '../../lib/dayjs';
import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import Item from './Item';

const Timezone = ({ utcOffset }: { utcOffset?: number }): React.ReactElement | null => {
	const Message_TimeFormat = useAppSelector(state => state.settings.Message_TimeFormat as string);

	if (!utcOffset) return null;

	return (
		<Item label={I18n.t('Timezone')} content={`${dayjs().utcOffset(utcOffset).format(Message_TimeFormat)} (UTC ${utcOffset})`} />
	);
};

export default Timezone;
