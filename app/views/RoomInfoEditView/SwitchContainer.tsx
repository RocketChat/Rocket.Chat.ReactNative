import React, { ReactElement } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';

import { useTheme } from '../../theme';
import styles from './styles';
import Switch from '../../containers/Switch';

interface ISwitchContainer {
	children?: ReactElement | null;
	value: boolean;
	disabled?: boolean;
	leftLabelPrimary: string;
	leftLabelSecondary?: string;
	onValueChange: (value: any) => void;
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
		testID,
		labelContainerStyle,
		leftLabelStyle
	}) => {
		const { colors } = useTheme();

		return (
			<View>
				<View key='switch-container' style={[styles.switchContainer, !!children && styles.switchMargin]}>
					{leftLabelPrimary && (
						<View
							accessible
							accessibilityLabel={`${leftLabelPrimary}. ${leftLabelSecondary ?? ''}. `}
							style={[styles.switchLabelContainer, labelContainerStyle]}>
							<Text style={[styles.switchLabelPrimary, { color: colors.fontTitlesLabels }, leftLabelStyle]}>
								{leftLabelPrimary}
							</Text>
							{leftLabelSecondary && (
								<Text style={[styles.switchLabelSecondary, { color: colors.fontSecondaryInfo }, leftLabelStyle]}>
									{leftLabelSecondary}
								</Text>
							)}
						</View>
					)}
					<Switch
						accessibilityRole='switch'
						accessible
						style={styles.switch}
						onValueChange={onValueChange}
						value={value}
						disabled={disabled}
						testID={testID}
					/>
				</View>
				{children}
			</View>
		);
	}
);

export default SwitchContainer;
