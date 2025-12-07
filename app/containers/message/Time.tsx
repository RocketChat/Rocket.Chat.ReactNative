import React from 'react';
import { Text } from 'react-native';

import dayjs from '../../lib/dayjs';
import { useTheme } from '../../theme';
import messageStyles from './styles';

interface IMessageTime {
	ts?: Date;
	timeFormat?: string;
}

const MessageTime = ({ timeFormat, ts }: IMessageTime) => {
	'use memo';

	const { colors } = useTheme();

	const time = dayjs(ts).format(timeFormat);

	return <Text style={[messageStyles.time, { color: colors.fontSecondaryInfo }]}>{time}</Text>;
};

export default MessageTime;
