import { memo } from 'react';

import Message from './Message';
import { type TAnyMessageModel } from '../../definitions';
import MessageSeparator from '../MessageSeparator';
import { MessageProvider } from './MessageStore';

interface IMessageContainerProps {
	item: TAnyMessageModel;
	timeFormat?: string;
	archived?: boolean;
	previousItem?: TAnyMessageModel;
	isReadReceiptEnabled?: boolean;
	isThreadRoom?: boolean;
	useRealName?: boolean;
	autoTranslateLanguage?: string;
	isIgnored?: boolean;
	highlighted?: boolean;
	onLongPress?: (item: TAnyMessageModel) => void;
	threadBadgeColor?: string;
	onPress?: () => void;
	isPreview?: boolean;
	dateSeparator?: Date | string | null;
	showUnreadSeparator?: boolean;
}

const MessageContainer = (props: IMessageContainerProps) => {
	'use memo';

	const { item, previousItem, dateSeparator, showUnreadSeparator } = props;
	return (
		<MessageProvider
			item={item}
			previousItem={previousItem}
			onPress={props.onPress}
			onLongPress={props.onLongPress}
			threadBadgeColor={props.threadBadgeColor}>
			<Message
				timeFormat={props.timeFormat}
				archived={props.archived ?? false}
				useRealName={props.useRealName}
				isReadReceiptEnabled={props.isReadReceiptEnabled}
				isThreadRoom={!!props.isThreadRoom}
				isPreview={props.isPreview}
				highlighted={props.highlighted}
				isIgnored={props.isIgnored ?? false}
				autoTranslateLanguage={props.autoTranslateLanguage}
			/>
			<MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />
		</MessageProvider>
	);
};

export default memo(MessageContainer);
