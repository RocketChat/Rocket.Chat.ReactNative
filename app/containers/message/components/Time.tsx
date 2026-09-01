import { Text } from 'react-native';

import dayjs from '../../../lib/dayjs';
import { useTheme } from '../../../theme';
import messageStyles from '../styles';
import { useMessageField } from '../stores/MessageStore';
import { useTimeFormat } from '../stores/MessageRoomStore';

const MessageTime = () => {
	const { colors } = useTheme();
	const ts = useMessageField(item => item.ts);
	const timeFormat = useTimeFormat();

	const time = dayjs(ts).format(timeFormat);

	return <Text style={[messageStyles.time, { color: colors.fontSecondaryInfo }]}>{time}</Text>;
};

export default MessageTime;
