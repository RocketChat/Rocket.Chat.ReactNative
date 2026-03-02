import { Text } from 'react-native';
import { useCallback, useMemo } from 'react';

import dayjs from '../../../lib/dayjs';
import { useTheme } from '../../../theme';
import { LISTENER } from '../../Toast';
import EventEmitter from '../../../lib/methods/helpers/events';
import sharedStyles from '../../../views/Styles';

interface ITimestampProps {
	value: { timestamp: string; format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' };
}

const Timestamp = ({ value }: ITimestampProps) => {
	const { colors } = useTheme();

	const timestampMs = useMemo(() => parseInt(value.timestamp, 10) * 1000, [value.timestamp]);

	const formatDate = useMemo(() => {
		if (value.format === 't') {
			return dayjs(timestampMs).format('hh:mm A');
		}

		if (value.format === 'T') {
			return dayjs(timestampMs).format('hh:mm:ss A');
		}

		if (value.format === 'd') {
			return dayjs(timestampMs).format('MM/DD/YYYY');
		}

		if (value.format === 'D') {
			return dayjs(timestampMs).format('dddd, MMM DD, YYYY');
		}

		if (value.format === 'f') {
			return dayjs(timestampMs).format('dddd, MMM DD, YYYY hh:mm A');
		}

		if (value.format === 'F') {
			return dayjs(timestampMs).format('dddd, MMM DD, YYYY hh:mm:ss A');
		}

		if (value.format === 'R') {
			return dayjs(timestampMs).fromNow();
		}

		return 'Invalid Date';
	}, [timestampMs, value.format]);

	const handlePress = useCallback(() => {
		const message = dayjs(timestampMs).format('dddd, MMM DD, YYYY hh:mm A');
		EventEmitter.emit(LISTENER, { message });
	}, [timestampMs]);

	return (
		<Text
			style={[sharedStyles.textMedium, { backgroundColor: colors.surfaceSelected, color: colors.fontDefault }]}
			onPress={handlePress}>
			{` ${formatDate} `}
		</Text>
	);
};

export default Timestamp;
