import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';
import { useAppSelector } from '../../lib/hooks';

export const LTSWarning = () => {
	const { colors } = useTheme();
	const { message, i18n } = useAppSelector(state => state.lts);
	const lang = 'en';

	if (!message) {
		return null;
	}

	// TODO: i18n
	return (
		<View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
			<View style={{ alignItems: 'center', padding: 24 }}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			{message.message.title ? <Text style={styles.ltsTitle}>{i18n![lang][message.message.title]}</Text> : null}
			{message.message.subtitle ? <Text style={styles.ltsSubtitle}>{i18n![lang][message.message.subtitle]}</Text> : null}
			{message.message.description ? <Text style={styles.ltsDescription}>{i18n![lang][message.message.description]}</Text> : null}
			<Button title='Learn more' type='secondary' backgroundColor={'#EEEFF1'} onPress={() => alert(message.link)} />
		</View>
	);
};
