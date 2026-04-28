import React from 'react';
import { Pressable, View } from 'react-native';
import { type Code as CodeProps } from '@rocket.chat/message-parser';
import Clipboard from '@react-native-clipboard/clipboard';

import styles from '../../styles';
import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../CustomIcon';
import EventEmitter from '../../../../lib/methods/helpers/events';
import { LISTENER } from '../../../Toast';
import I18n from '../../../../i18n';
import CodeLine from './CodeLine';

interface ICodeProps {
	value: CodeProps['value'];
}

const Code = ({ value }: ICodeProps): React.ReactElement => {
	const { colors } = useTheme();

	const handleCopy = () => {
		const text = value
			.filter(block => block.type === 'CODE_LINE')
			.map(block => (block.value.type === 'PLAIN_TEXT' ? block.value.value : ''))
			.join('\n');
		Clipboard.setString(text);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	return (
		<View
			style={[
				styles.codeBlock,
				{
					backgroundColor: colors.surfaceNeutral,
					borderColor: colors.strokeLight
				}
			]}>
			<Pressable style={styles.codeBlockCopyButton} onPress={handleCopy} hitSlop={8}>
				<CustomIcon name='copy' size={18} color={colors.fontSecondaryInfo} />
			</Pressable>
			{value.map(block => {
				switch (block.type) {
					case 'CODE_LINE':
						return <CodeLine value={block.value} />;
					default:
						return null;
				}
			})}
		</View>
	);
};

export default Code;
