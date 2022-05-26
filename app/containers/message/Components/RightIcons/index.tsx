import React from 'react';
import { StyleSheet, View } from 'react-native';

import Encrypted from './Encrypted';
import Edited from './Edited';
import MessageError from './MessageError';
import ReadReceipt from './ReadReceipt';
import { MessageType } from '../../../../definitions';

const styles = StyleSheet.create({
	actionIcons: {
		flexDirection: 'row'
	}
});

interface IRightIcons {
	type: MessageType;
	msg?: string;
	isEdited: boolean;
	isReadReceiptEnabled: boolean;
	unread: boolean;
	hasError: boolean;
}

const RightIcons = ({ type, msg, isEdited, hasError, isReadReceiptEnabled, unread }: IRightIcons) => (
	<View style={styles.actionIcons}>
		<Encrypted type={type} />
		<Edited testID={`${msg}-edited`} isEdited={isEdited} />
		<MessageError hasError={hasError} />
		<ReadReceipt isReadReceiptEnabled={isReadReceiptEnabled} unread={unread || false} />
	</View>
);

export default RightIcons;
