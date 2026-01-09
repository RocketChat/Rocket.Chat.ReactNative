import React from 'react';
import { Text } from 'react-native';

import dayjs from '../../lib/dayjs';
import { useTheme } from '../../theme';
import messageStyles from './styles';
import { useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

interface IMessageTime {
	ts?: Date;
	timeFormat?: string;
}

const MessageTime = ({ timeFormat, ts }: IMessageTime) => {
	'use memo';

	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();

	const time = dayjs(ts).format(timeFormat);

	return <Text style={[messageStyles.time, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(13), lineHeight: scaleFontSize(18) }]}>{time}</Text>;
};

export default MessageTime;
