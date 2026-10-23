import { useEffect, useState } from 'react';
import { StyleSheet, Text, unstable_batchedUpdates, View } from 'react-native';
import DateTimePicker, { type BaseProps } from '@react-native-community/datetimepicker';
import { BlockContext } from '@rocket.chat/ui-kit';

import dayjs from '~/lib/dayjs';
import Button from './Button';
import { textParser } from './utils';
import { themes } from '~/lib/constants/colors';
import sharedStyles from '~/views/Styles';
import { CustomIcon } from '../CustomIcon';
import { isAndroid } from '~/lib/methods/helpers';
import { useTheme } from '~/theme';
import ActivityIndicator from '../ActivityIndicator';
import { type IText, type ITimePicker } from './interfaces';
import Touch from '../Touch';

const styles = StyleSheet.create({
	input: {
		height: 48,
		paddingLeft: 16,
		borderWidth: 1,
		borderRadius: 4,
		alignItems: 'center',
		flexDirection: 'row'
	},
	inputText: {
		...sharedStyles.textRegular,
		fontSize: 14
	},
	icon: {
		right: 16,
		position: 'absolute'
	},
	loading: {
		padding: 0
	}
});

const parseInitialTime = (value?: string, initialTime?: string): Date | undefined => {
	const source = value || initialTime || '';
	const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(source);
	if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) {
		return undefined;
	}
	const parsed = new Date();
	parsed.setHours(Number(match[1]), Number(match[2]), 0, 0);
	return parsed;
};

const resolveDisplayText = (
	currentTime: Date | undefined,
	hasPicked: boolean,
	placeholder: IText | undefined,
	language: string
): string => {
	if (currentTime || hasPicked) {
		return (currentTime ?? new Date()).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' });
	}
	if (placeholder) {
		return textParser([placeholder]);
	}
	return '';
};

const resolveDisplayColor = (hasValue: boolean, hasError: boolean, theme: ReturnType<typeof useTheme>['theme']) => {
	if (!hasValue) {
		return themes[theme].fontSecondaryInfo;
	}
	if (hasError) {
		return themes[theme].fontDanger;
	}
	return themes[theme].fontTitlesLabels;
};

export const TimePicker = ({ element, language, action, context, loading, value, error }: ITimePicker) => {
	const { theme } = useTheme();
	const [show, onShow] = useState(false);
	const initialTime = parseInitialTime(value, element?.initialTime);
	const placeholder = element?.placeholder;

	const [currentTime, onChangeTime] = useState<Date | undefined>(initialTime);
	const [hasPicked, onHasPicked] = useState(false);
	const initialTimeProp = element?.initialTime;

	useEffect(() => {
		if (value) {
			onChangeTime(parseInitialTime(value));
		} else {
			onChangeTime(parseInitialTime(initialTimeProp));
		}
		if (!value && !initialTimeProp) {
			onHasPicked(false);
		}
	}, [value, initialTimeProp]);

	const onChange: BaseProps['onChange'] = ({ nativeEvent: { timestamp } }, date?) => {
		if (date || timestamp) {
			const newTime = date || new Date(timestamp);
			unstable_batchedUpdates(() => {
				onChangeTime(newTime);
				onHasPicked(true);
				if (isAndroid) {
					onShow(false);
				}
			});
			action({ value: dayjs(newTime).format('HH:mm') });
		}
	};

	const displayDate = currentTime ?? new Date();
	const hasValue = Boolean(currentTime || hasPicked);
	const displayText = resolveDisplayText(currentTime, hasPicked, placeholder, language);
	const displayColor = resolveDisplayColor(hasValue, Boolean(error), theme);

	let button = placeholder ? <Button title={textParser([placeholder])} onPress={() => onShow(!show)} loading={loading} /> : null;

	if (context === BlockContext.FORM) {
		button = (
			<Touch onPress={() => onShow(!show)} style={{ backgroundColor: themes[theme].surfaceRoom }}>
				<View
					style={[
						styles.input,
						{ borderColor: error ? themes[theme].buttonBackgroundDangerDefault : themes[theme].strokeLight }
					]}>
					<Text style={[styles.inputText, { color: displayColor }]}>{displayText}</Text>
					{loading ? (
						<ActivityIndicator style={[styles.loading, styles.icon]} />
					) : (
						<CustomIcon
							name='clock'
							size={20}
							color={error ? themes[theme].buttonBackgroundDangerDefault : themes[theme].fontSecondaryInfo}
							style={styles.icon}
						/>
					)}
				</View>
			</Touch>
		);
	}

	const content = show ? (
		<DateTimePicker
			mode='time'
			display={isAndroid ? 'default' : 'spinner'}
			value={displayDate}
			onChange={onChange}
			textColor={themes[theme].fontTitlesLabels}
		/>
	) : null;

	return (
		<>
			{button}
			{content}
		</>
	);
};
