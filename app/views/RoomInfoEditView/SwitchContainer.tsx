import React, { ReactElement } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import styles from './styles';
import Switch from '../../containers/Switch';

interface ISwitchContainer {
	children?: ReactElement | null;
	value: boolean;
	disabled?: boolean;
	leftLabelPrimary: string;
	leftLabelSecondary?: string;
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
		theme,
		testID,
		labelContainerStyle,
		leftLabelStyle
	}) => (
		<View>
			<View key='switch-container' style={[styles.switchContainer, !!children && styles.switchMargin]}>
				{leftLabelPrimary && (
					<View style={[styles.switchLabelContainer, labelContainerStyle]}>
						<Text style={[styles.switchLabelPrimary, { color: themes[theme].fontTitlesLabels }, leftLabelStyle]}>
							{leftLabelPrimary}
						</Text>
						{leftLabelSecondary && (
							<Text style={[styles.switchLabelSecondary, { color: themes[theme].fontSecondaryInfo }, leftLabelStyle]}>
								{leftLabelSecondary}
							</Text>
						)}
					</View>
				)}
				<Switch style={styles.switch} onValueChange={onValueChange} value={value} disabled={disabled} testID={testID} />
			</View>
			{children}
		</View>
	)
);

export default SwitchContainer;
