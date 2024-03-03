import React from 'react';
import { StyleSheet, View } from 'react-native';

import Encrypted from './Encrypted';
import Edited from './Edited';
import MessageError from './MessageError';
import ReadReceipt from './ReadReceipt';
import Translated from './Translated';
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
	isReadReceiptEnabled?: boolean;
	unread?: boolean;
	hasError: boolean;
	isTranslated: boolean;
}

const RightIcons = ({ type, msg, isEdited, hasError, isReadReceiptEnabled, unread, isTranslated }: IRightIcons) => (
	<View style={styles.actionIcons}>
		<Encrypted type={type} />
		<Edited testID={`${msg}-edited`} isEdited={isEdited} />
		<MessageError hasError={hasError} />
		<Translated isTranslated={isTranslated} />
		<ReadReceipt isReadReceiptEnabled={isReadReceiptEnabled} unread={unread} />
	</View>
);

export default RightIcons;
