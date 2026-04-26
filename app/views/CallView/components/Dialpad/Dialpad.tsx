import React from 'react';
import { View } from 'react-native';

import { FormTextInput } from '../../../../containers/TextInput';
import { styles } from './styles';
import DialpadButton from './DialpadButton';
import { DialpadProvider } from './DialpadContext';
import { useCallLayoutMode } from '../../useCallLayoutMode';
import { useDialpadValue } from '../../../../lib/services/voip/useCallStore';
import { useTheme } from '../../../../theme';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const DIALPAD_KEYS: { digit: string; letters: string }[][] = [
	[
		{ digit: '1', letters: '' },
		{ digit: '2', letters: 'ABC' },
		{ digit: '3', letters: 'DEF' }
	],
	[
		{ digit: '4', letters: 'GHI' },
		{ digit: '5', letters: 'JKL' },
		{ digit: '6', letters: 'MNO' }
	],
	[
		{ digit: '7', letters: 'PQRS' },
		{ digit: '8', letters: 'TUV' },
		{ digit: '9', letters: 'WXYZ' }
	],
	[
		{ digit: '*', letters: '' },
		{ digit: '0', letters: '+' },
		{ digit: '#', letters: '' }
	]
];

interface IDialpad {
	testID?: string;
}

export const DialpadGrid = (): React.ReactElement => (
	<View style={styles.grid}>
		{DIALPAD_KEYS.map((row, rowIndex) => (
			<View key={rowIndex} style={styles.row}>
				{row.map(({ digit, letters }) => (
					<DialpadButton key={digit} digit={digit} letters={letters} />
				))}
			</View>
		))}
	</View>
);

const Dialpad = ({ testID }: IDialpad): React.ReactElement => {
	const { layoutMode } = useCallLayoutMode();
	const { width, height } = useResponsiveLayout();
	const { colors } = useTheme();
	const dialpadValue = useDialpadValue();

	const isPhoneLandscape = width > height && layoutMode === 'narrow';

	const input = (
		<FormTextInput
			value={dialpadValue}
			placeholder=''
			keyboardType='phone-pad'
			containerStyle={styles.inputContainer}
			showErrorMessage={false}
			testID={testID ? `${testID}-input` : 'dialpad-input'}
			editable={false}
			multiline
		/>
	);

	if (isPhoneLandscape) {
		return (
			<DialpadProvider>
				<View testID='dialpad-landscape-container' style={[styles.landscapeContainer, { backgroundColor: colors.surfaceLight }]}>
					<View style={styles.landscapeInputSection}>{input}</View>
					<View style={styles.landscapeGridSection}>
						<DialpadGrid />
					</View>
				</View>
			</DialpadProvider>
		);
	}

	return (
		<DialpadProvider>
			<View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
				{input}
				<DialpadGrid />
			</View>
		</DialpadProvider>
	);
};

export default Dialpad;
