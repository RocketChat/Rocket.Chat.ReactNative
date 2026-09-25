import { PlainText } from '~/containers/PlainText';

import dayjs from '~/lib/dayjs';
import { useTheme } from '~/theme';
import messageStyles from '../styles';
import { useMessageField } from '../stores/MessageStore';
import { useTimeFormat } from '../stores/MessageRoomStore';

const MessageTime = () => {
	const { colors } = useTheme();
	const ts = useMessageField(item => item.ts);
	const timeFormat = useTimeFormat();

	const time = dayjs(ts).format(timeFormat);

	return <PlainText style={[messageStyles.time, { color: colors.fontSecondaryInfo }]}>{time}</PlainText>;
};

export default MessageTime;
