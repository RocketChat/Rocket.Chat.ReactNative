import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import sharedStyles from '../Styles';
import { FONT_SIZE_PREFERENCES_KEY } from '../../lib/constants/keys';
import { FONT_SIZE_OPTIONS, ResponsiveLayoutContext, useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import Avatar from '../../containers/Avatar';
import { useAppSelector } from '../../lib/hooks/useAppSelector';

const FONT_SIZE_OPTIONS_ARRAY = [
	FONT_SIZE_OPTIONS.SMALL,
	FONT_SIZE_OPTIONS.NORMAL,
	FONT_SIZE_OPTIONS.LARGE,
	FONT_SIZE_OPTIONS.EXTRA_LARGE
];

const FONT_SIZE_LABELS = {
	[FONT_SIZE_OPTIONS.SMALL]: 'Small',
	[FONT_SIZE_OPTIONS.NORMAL]: 'Normal',
	[FONT_SIZE_OPTIONS.LARGE]: 'Large',
	[FONT_SIZE_OPTIONS.EXTRA_LARGE]: 'Extra_Large'
};

interface IFontSizePickerProps {
	title: string;
	testID: string;
}

const ExampleMessage = ({ previewFontSize }: { previewFontSize: number }) => {
	const { colors } = useTheme();
	const { fontScale: systemFontScale } = useResponsiveLayout();
	const server = useAppSelector(state => state.server.server);
	
	const previewFontScale = systemFontScale * previewFontSize;
	const previewScaleFontSize = (size: number) => size * previewFontSize;
	
	const previewContextValue = {
		fontScale: previewFontScale,
		width: 0,
		height: 0,
		isLargeFontScale: previewFontScale > 1.3,
		fontScaleLimited: previewFontScale > 1.3 ? 1.3 : previewFontScale,
		rowHeight: 75 * previewFontScale,
		rowHeightCondensed: 60 * previewFontScale,
		scaleFontSize: previewScaleFontSize
	};

	return (
		<ResponsiveLayoutContext.Provider value={previewContextValue}>
			<View style={styles.exampleMessageContainer}>
				<View style={styles.exampleMessage}>
					<View style={styles.avatarContainer}>
						<Avatar
							text='RC'
							size={previewScaleFontSize(36)}
							borderRadius={4}
							server={server || 'https://open.rocket.chat'}
						/>
					</View>
					<View style={styles.exampleMessageContent}>
						<View style={styles.exampleMessageHeader}>
							<Text style={[styles.exampleUsername, { color: colors.fontTitlesLabels, fontSize: previewScaleFontSize(16), lineHeight: previewScaleFontSize(22) }]}>
								Rocket.Cat
							</Text>
							<Text style={[styles.exampleTime, { color: colors.fontSecondaryInfo, fontSize: previewScaleFontSize(12) }]}>
								10:30 AM
							</Text>
						</View>
						<Text style={[styles.exampleMessageText, { color: colors.fontDefault, fontSize: previewScaleFontSize(16), lineHeight: previewScaleFontSize(22) }]}>
							{I18n.t('Font_Size_Example_Message', { defaultValue: 'This is an example message to preview how the text size will look.' }) || 'This is an example message to preview how the text size will look.'}
						</Text>
					</View>
				</View>
			</View>
		</ResponsiveLayoutContext.Provider>
	);
};

const FontSizePicker = ({ title, testID }: IFontSizePickerProps) => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const [fontSize, setFontSize] = useUserPreferences<string>(FONT_SIZE_PREFERENCES_KEY, FONT_SIZE_OPTIONS.NORMAL.toString());
	const [previewFontSize, setPreviewFontSize] = useState(parseFloat(fontSize || FONT_SIZE_OPTIONS.NORMAL.toString()));

	const currentIndex = FONT_SIZE_OPTIONS_ARRAY.findIndex(opt => opt.toString() === fontSize);
	const sliderValue = currentIndex >= 0 ? currentIndex : 1;

	const handleSliderChange = (value: number) => {
		const index = Math.round(value);
		const selectedFontSize = FONT_SIZE_OPTIONS_ARRAY[index];
		setPreviewFontSize(selectedFontSize);
	};

	const handleSliderComplete = (value: number) => {
		const index = Math.round(value);
		const selectedFontSize = FONT_SIZE_OPTIONS_ARRAY[index];
		setFontSize(selectedFontSize.toString());
		setPreviewFontSize(selectedFontSize);
	};

	const fontSizeValue = fontSize || FONT_SIZE_OPTIONS.NORMAL.toString();
	const currentLabel = FONT_SIZE_LABELS[parseFloat(fontSizeValue) as keyof typeof FONT_SIZE_LABELS] || 'Normal';
	const primaryColor = colors.buttonBackgroundPrimaryDefault;
	const trackColor = colors.strokeLight;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.fontTitlesLabels, fontSize: scaleFontSize(16) }]}>
					{I18n.t(title, { defaultValue: title }) ?? title}
				</Text>
				<Text style={[styles.currentSize, { color: colors.fontHint, fontSize: scaleFontSize(14) }]}>
					{I18n.t(currentLabel || 'Normal', { defaultValue: currentLabel || 'Normal' }) ?? currentLabel}
				</Text>
			</View>
			<ExampleMessage previewFontSize={previewFontSize} />
			<View style={styles.sliderContainer}>
				<View style={styles.sliderLabels}>
					<Text style={[styles.sliderLabel, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(12) }]}>A</Text>
					<Text style={[styles.sliderLabel, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(20) }]}>A</Text>
				</View>
				<Slider
					style={styles.slider}
					minimumValue={0}
					maximumValue={FONT_SIZE_OPTIONS_ARRAY.length - 1}
					value={sliderValue}
					step={1}
					minimumTrackTintColor={primaryColor}
					maximumTrackTintColor={trackColor}
					thumbTintColor={primaryColor}
					onValueChange={handleSliderChange}
					onSlidingComplete={handleSliderComplete}
					testID={`${testID}-slider`}
				/>
				<View style={styles.sliderSteps}>
					{FONT_SIZE_OPTIONS_ARRAY.map((_, index) => (
						<View
							key={index}
							style={[
								styles.sliderStep,
								{
									backgroundColor: index === sliderValue ? primaryColor : trackColor,
									width: index === sliderValue ? 8 : 4,
									height: index === sliderValue ? 8 : 4,
									borderRadius: index === sliderValue ? 4 : 2
								}
							]}
						/>
					))}
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: 16,
		paddingHorizontal: 16
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16
	},
	title: {
		...sharedStyles.textSemibold
	},
	currentSize: {
		...sharedStyles.textRegular
	},
	exampleMessageContainer: {
		backgroundColor: 'transparent',
		marginBottom: 24,
		paddingVertical: 12
	},
	exampleMessage: {
		flexDirection: 'row',
		paddingHorizontal: 12
	},
	avatarContainer: {
		width: 36,
		alignItems: 'flex-end'
	},
	exampleMessageContent: {
		flex: 1,
		marginLeft: 10
	},
	exampleMessageHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 4,
		gap: 8
	},
	exampleUsername: {
		...sharedStyles.textSemibold
	},
	exampleTime: {
		...sharedStyles.textRegular
	},
	exampleMessageText: {
		...sharedStyles.textRegular
	},
	sliderContainer: {
		paddingVertical: 8
	},
	sliderLabels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8
	},
	sliderLabel: {
		...sharedStyles.textRegular
	},
	slider: {
		width: '100%',
		height: 40
	},
	sliderSteps: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 2
	},
	sliderStep: {
		alignSelf: 'center'
	}
});

export default FontSizePicker;
