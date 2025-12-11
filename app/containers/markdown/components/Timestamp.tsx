import React from 'react';
import { Text } from 'react-native';

import dayjs from '../../../lib/dayjs';
import { useTheme } from '../../../theme';
import { LISTENER } from '../../Toast';
import EventEmitter from '../../../lib/methods/helpers/events';
import sharedStyles from '../../../views/Styles';

interface ITimestampProps {
	value: { timestamp: string; format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' };
}

const Timestamp = ({ value }: ITimestampProps): React.ReactElement => {
	const { colors } = useTheme();

	const formatDate = React.useMemo(() => {
		const timestamp = parseInt(value.timestamp) * 1000;

		if (value.format === 't') {
			return dayjs(timestamp).format('hh:mm A');
		}

		if (value.format === 'T') {
			return dayjs(timestamp).format('hh:mm:ss A');
		}

		if (value.format === 'd') {
			return dayjs(timestamp).format('MM/DD/YYYY');
		}

		if (value.format === 'D') {
			return dayjs(timestamp).format('dddd, MMM DD, YYYY');
		}

		if (value.format === 'f') {
			return dayjs(timestamp).format('dddd, MMM DD, YYYY hh:mm A');
		}

		if (value.format === 'F') {
			return dayjs(timestamp).format('dddd, MMM DD, YYYY hh:mm:ss A');
		}

		if (value.format === 'R') {
			return dayjs(timestamp).fromNow();
		}

		return 'Invalid Date';
	}, [value]);

	const handlePress = React.useCallback(() => {
		const message = dayjs(parseInt(value.timestamp) * 1000).format('dddd, MMM DD, YYYY hh:mm A');
		EventEmitter.emit(LISTENER, { message });
	}, [value.timestamp]);

	return (
		<Text
			style={[sharedStyles.textMedium, { backgroundColor: colors.surfaceSelected, color: colors.fontDefault }]}
			onPress={handlePress}>
			{` ${formatDate} `}
		</Text>
	);
};

export default Timestamp;
