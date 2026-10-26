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
import { type IDatePicker, type IText } from './interfaces';
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

const parseInitialDate = (value?: string, initialDate?: string): Date | undefined => {
	const parsed = new Date(value || initialDate || '');
	return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const resolveDisplayText = (
	currentDate: Date | undefined,
	hasPicked: boolean,
	placeholder: IText | undefined,
	language: string
): string => {
	if (currentDate || hasPicked) {
		return (currentDate ?? new Date()).toLocaleDateString(language);
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

export const DatePicker = ({ element, language, action, context, loading, value, error }: IDatePicker) => {
	const { theme } = useTheme();
	const [show, onShow] = useState(false);
	const initialDate = parseInitialDate(value, element?.initialDate);
	const placeholder = element?.placeholder;

	const [currentDate, onChangeDate] = useState<Date | undefined>(initialDate);
	const [hasPicked, onHasPicked] = useState(false);
	const initialDateProp = element?.initialDate;

	useEffect(() => {
		if (value) {
			onChangeDate(parseInitialDate(value));
		} else {
			onChangeDate(parseInitialDate(initialDateProp));
		}
		if (!value && !initialDateProp) {
			onHasPicked(false);
		}
	}, [value, initialDateProp]);

	const onChange: BaseProps['onChange'] = ({ nativeEvent: { timestamp } }, date?) => {
		if (date || timestamp) {
			const newDate = date || new Date(timestamp);
			unstable_batchedUpdates(() => {
				onChangeDate(newDate);
				onHasPicked(true);
				if (isAndroid) {
					onShow(false);
				}
			});
			action({ value: dayjs(newDate).format('YYYY-MM-DD') });
		}
	};

	const displayDate = currentDate ?? new Date();
	const hasValue = Boolean(currentDate || hasPicked);
	const displayText = resolveDisplayText(currentDate, hasPicked, placeholder, language);
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
							name='calendar'
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
			mode='date'
			display={isAndroid ? 'default' : 'inline'}
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
