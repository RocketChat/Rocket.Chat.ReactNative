import React from 'react';
import { View } from 'react-native';

import { useDialpadValue } from '../../../../lib/services/voip/useCallStore';
import { FormTextInput } from '../../../../containers/TextInput';
import { useTheme } from '../../../../theme';
import { styles } from './styles';
import DialpadButton from './DialpadButton';

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

const Dialpad = ({ testID }: IDialpad): React.ReactElement => {
	const { colors } = useTheme();
	const dialpadValue = useDialpadValue();

	return (
		<View style={[styles.container, { backgroundColor: colors.surfaceLight }]}>
			<FormTextInput
				value={dialpadValue}
				placeholder=''
				keyboardType='phone-pad'
				containerStyle={styles.inputContainer}
				showErrorMessage={false}
				bottomSheet
				testID={testID ? `${testID}-input` : 'dialpad-input'}
				editable={false}
			/>
			<View style={styles.grid}>
				{DIALPAD_KEYS.map((row, rowIndex) => (
					<View key={rowIndex} style={styles.row}>
						{row.map(({ digit, letters }) => (
							<DialpadButton key={digit} digit={digit} letters={letters} />
						))}
					</View>
				))}
			</View>
		</View>
	);
};

export default Dialpad;
