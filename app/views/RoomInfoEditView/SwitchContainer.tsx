import React from 'react';
import { Switch, Text, TextStyle, View, ViewStyle } from 'react-native';

import { TSupportedThemes } from '../../theme';
import { SWITCH_TRACK_COLOR, themes } from '../../lib/constants';
import styles from './styles';

interface ISwitchContainer {
	value: boolean;
	disabled?: boolean;
	leftLabelPrimary: string;
	leftLabelSecondary: string;
	rightLabelPrimary?: string;
	rightLabelSecondary?: string;
	onValueChange: (value: any) => void;
	theme: TSupportedThemes;
	testID: string;
	labelContainerStyle?: ViewStyle;
	leftLabelStyle?: TextStyle;
}

const SwitchContainer: React.FC<ISwitchContainer> = React.memo(
	({
		children,
		value,
		disabled,
		onValueChange,
		leftLabelPrimary,
		leftLabelSecondary,
		rightLabelPrimary,
		rightLabelSecondary,
		theme,
		testID,
		labelContainerStyle,
		leftLabelStyle
	}) => (
		<>
			<View key='switch-container' style={[styles.switchContainer, !!children && styles.switchMargin]}>
				{leftLabelPrimary && (
					<View style={[styles.switchLabelContainer, labelContainerStyle]}>
						<Text style={[styles.switchLabelPrimary, { color: themes[theme].titleText }, leftLabelStyle]}>
							{leftLabelPrimary}
						</Text>
						<Text style={[styles.switchLabelSecondary, { color: themes[theme].titleText }, leftLabelStyle]}>
							{leftLabelSecondary}
						</Text>
					</View>
				)}
				<Switch
					style={styles.switch}
					onValueChange={onValueChange}
					value={value}
					disabled={disabled}
					trackColor={SWITCH_TRACK_COLOR}
					testID={testID}
				/>
				{rightLabelPrimary && (
					<View style={[styles.switchLabelContainer, labelContainerStyle]}>
						<Text style={[styles.switchLabelPrimary, { color: themes[theme].titleText }, leftLabelStyle]}>
							{rightLabelPrimary}
						</Text>
						<Text style={[styles.switchLabelSecondary, { color: themes[theme].titleText }, leftLabelStyle]}>
							{rightLabelSecondary}
						</Text>
					</View>
				)}
			</View>
			{children}
			<View key='switch-divider' style={[styles.divider, { borderColor: themes[theme].separatorColor }]} />
		</>
	)
);

export default SwitchContainer;
