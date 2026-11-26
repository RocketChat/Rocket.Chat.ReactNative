import { type ReactElement } from 'react';

import dayjs from '~/lib/dayjs';
import I18n from '~/i18n';
import { useAppSelector } from '~/lib/hooks/useAppSelector';
import Item from './Item';
import { getUserSelector } from '~/selectors/login';
import { getTimeFormat } from '~/lib/methods/helpers/getTimeFormat';

const Timezone = ({ utcOffset }: { utcOffset?: number }): ReactElement | null => {
	const Message_TimeFormat = useAppSelector(state => state.settings.Message_TimeFormat as string);
	const clockMode = useAppSelector(s => getUserSelector(s)?.settings?.preferences?.clockMode);

	const timeFormat = getTimeFormat(clockMode, Message_TimeFormat);

	if (!utcOffset) return null;

	return <Item label={I18n.t('Timezone')} content={`${dayjs().utcOffset(utcOffset).format(timeFormat)} (UTC ${utcOffset})`} />;
};

export default Timezone;
