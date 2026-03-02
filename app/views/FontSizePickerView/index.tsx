import React, { useState, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import Slider from '@react-native-community/slider';

import I18n from '../../i18n';
import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import sharedStyles from '../Styles';
import { FONT_SIZE_PREFERENCES_KEY } from '../../lib/constants/keys';
import { FONT_SIZE_OPTIONS, ResponsiveLayoutContext, useResponsiveLayout } from '../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import { useUserPreferences } from '../../lib/methods/userPreferences';
import Avatar from '../../containers/Avatar';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { type ProfileStackParamList } from '../../stacks/types';

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

interface IFontSizePickerViewProps {
	navigation: NativeStackNavigationProp<ProfileStackParamList, 'FontSizePickerView'>;
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
				<View style={[styles.exampleMessage, { backgroundColor: colors.surfaceRoom }]}>
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

const FontSizePickerView = ({ navigation }: IFontSizePickerViewProps) => {
	const { colors } = useTheme();
	const { scaleFontSize } = useResponsiveLayout();
	const [fontSize, setFontSize] = useUserPreferences<number>(FONT_SIZE_PREFERENCES_KEY, FONT_SIZE_OPTIONS.NORMAL);
	const [previewFontSize, setPreviewFontSize] = useState(fontSize ?? FONT_SIZE_OPTIONS.NORMAL);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Font_Size', { defaultValue: 'Font Size' })
		});
	}, [navigation]);

	const currentIndex = FONT_SIZE_OPTIONS_ARRAY.findIndex(opt => opt === fontSize);
	const sliderValue = currentIndex >= 0 ? currentIndex : 1;

	const handleSliderChange = (value: number) => {
		const index = Math.round(value);
		const selectedFontSize = FONT_SIZE_OPTIONS_ARRAY[index];
		setPreviewFontSize(selectedFontSize);
	};

	const handleSliderComplete = (value: number) => {
		const index = Math.round(value);
		const selectedFontSize = FONT_SIZE_OPTIONS_ARRAY[index];
		setFontSize(selectedFontSize);
		setPreviewFontSize(selectedFontSize);
	};

	const fontSizeValue = fontSize ?? FONT_SIZE_OPTIONS.NORMAL;
	const currentLabel = FONT_SIZE_LABELS[fontSizeValue as keyof typeof FONT_SIZE_LABELS] || 'Normal';
	const primaryColor = colors.buttonBackgroundPrimaryDefault;
	const trackColor = colors.strokeLight;

	return (
		<SafeAreaView testID='font-size-picker-view' style={{ backgroundColor: colors.surfaceTint }}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.container}>
					<View style={styles.headerSection}>
						<Text style={[styles.description, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(14), lineHeight: scaleFontSize(20) }]}>
							{I18n.t('Font_Size_Description', { defaultValue: 'Adjust the font size for all text in the application.' }) || 'Adjust the font size for all text in the application.'}
						</Text>
					</View>

					<ExampleMessage previewFontSize={previewFontSize} />

					<View style={styles.sliderSection}>
						<View style={styles.sliderLabels}>
							<Text style={[styles.sliderLabelSmall, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(12) }]}>A</Text>
							<Text style={[styles.sliderLabelLarge, { color: colors.fontSecondaryInfo, fontSize: scaleFontSize(20) }]}>A</Text>
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
							testID='font-size-picker-slider'
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
						<View style={styles.currentSizeContainer}>
							<Text style={[styles.currentSizeLabel, { color: colors.fontHint, fontSize: scaleFontSize(12) }]}>
								{I18n.t('Current_Size', { defaultValue: 'Current size' })}: 
							</Text>
							<Text style={[styles.currentSizeValue, { color: colors.fontTitlesLabels, fontSize: scaleFontSize(14) }]}>
								{I18n.t(currentLabel || 'Normal', { defaultValue: currentLabel || 'Normal' }) ?? currentLabel}
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1
	},
	container: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 24,
		paddingBottom: 32
	},
	headerSection: {
		marginBottom: 32
	},
	description: {
		...sharedStyles.textRegular,
		textAlign: 'center'
	},
	exampleMessageContainer: {
		marginBottom: 40,
		paddingHorizontal: 4
	},
	exampleMessage: {
		flexDirection: 'row',
		padding: 16,
		borderRadius: 12,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
	},
	avatarContainer: {
		width: 36,
		alignItems: 'flex-end',
		marginRight: 10
	},
	exampleMessageContent: {
		flex: 1
	},
	exampleMessageHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
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
	sliderSection: {
		paddingVertical: 16
	},
	sliderLabels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
		paddingHorizontal: 4
	},
	sliderLabelSmall: {
		...sharedStyles.textRegular
	},
	sliderLabelLarge: {
		...sharedStyles.textRegular
	},
	slider: {
		width: '100%',
		height: 44
	},
	sliderSteps: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 12,
		paddingHorizontal: 6
	},
	sliderStep: {
		alignSelf: 'center'
	},
	currentSizeContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
		gap: 8
	},
	currentSizeLabel: {
		...sharedStyles.textRegular
	},
	currentSizeValue: {
		...sharedStyles.textSemibold
	}
});

export default FontSizePickerView;
