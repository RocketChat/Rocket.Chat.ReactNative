import { type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import Edited from './Edited';
import Encrypted from './Encrypted';
import MessageError from './MessageError';
import Pinned from './Pinned';
import ReadReceipt from './ReadReceipt';
import Translated from './Translated';

const styles = StyleSheet.create({
	actionIcons: {
		flexDirection: 'row'
	}
});

interface IRightIcons {
	msg?: string;
}

const RightIcons = ({ msg }: IRightIcons): ReactElement => {
	'use memo';

	return (
		<View style={styles.actionIcons}>
			<Pinned testID={`${msg}-pinned`} />
			<Encrypted />
			<Edited testID={`${msg}-edited`} />
			<MessageError />
			<Translated />
			<ReadReceipt />
		</View>
	);
};

export default RightIcons;
