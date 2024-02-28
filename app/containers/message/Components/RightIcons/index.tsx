import React from 'react';
import { StyleSheet, View } from 'react-native';

import { MessageType } from '../../../../definitions';
import Edited from './Edited';
import Encrypted from './Encrypted';
import MessageError from './MessageError';
import Pinned from './Pinned';
import ReadReceipt from './ReadReceipt';

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
	pinned?: boolean;
}

const RightIcons = ({ type, msg, isEdited, hasError, isReadReceiptEnabled, unread, pinned }: IRightIcons): React.ReactElement => (
	<View style={styles.actionIcons}>
		<Pinned pinned={pinned} />
		<Encrypted type={type} />
		<Edited testID={`${msg}-edited`} isEdited={isEdited} />
		<MessageError hasError={hasError} />
		<ReadReceipt isReadReceiptEnabled={isReadReceiptEnabled} unread={unread} />
	</View>
);

export default RightIcons;
