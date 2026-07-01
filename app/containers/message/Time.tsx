import { Text, type TextStyle } from 'react-native';

import dayjs from '../../lib/dayjs';
import { useTheme } from '../../theme';
import messageStyles from './styles';
import { useMessageField } from './MessageStore';

interface IMessageTime {
	ts?: Date;
	timeFormat?: string;
	style?: TextStyle;
}

const MessageTime = ({ timeFormat, style }: IMessageTime) => {
	'use memo';

	const { colors } = useTheme();
	const ts = useMessageField(item => item.ts);

	const time = dayjs(ts).format(timeFormat);

	return <Text style={[messageStyles.time, { color: colors.fontSecondaryInfo }, style]}>{time}</Text>;
};

export default MessageTime;
