import { memo } from 'react';

import MessageTouchable from './components/Touchable/MessageTouchable';
import { type TAnyMessageModel } from '../../definitions';
import MessageSeparator from '../MessageSeparator';
import { MessageProvider, useMessageSeparators } from './stores/MessageStore';

interface IMessageContainerProps {
	item: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
	lastSeen?: Date | null;
	withSeparators?: boolean;
	isIgnored?: boolean;
	highlighted?: boolean;
	onLongPress?: (item: TAnyMessageModel) => void;
	threadBadgeColor?: string;
	onPress?: () => void;
	isPreview?: boolean;
}

const MessageSeparators = () => {
	const { dateSeparator, showUnreadSeparator } = useMessageSeparators();
	return <MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />;
};

const MessageContainer = (props: IMessageContainerProps) => {
	const { item, previousItem, lastSeen, withSeparators } = props;
	return (
		<MessageProvider
			item={item}
			previousItem={previousItem}
			lastSeen={lastSeen}
			onPress={props.onPress}
			onLongPress={props.onLongPress}
			threadBadgeColor={props.threadBadgeColor}
			isIgnored={props.isIgnored}>
			<MessageTouchable isPreview={props.isPreview} highlighted={props.highlighted} />
			{withSeparators ? <MessageSeparators /> : null}
		</MessageProvider>
	);
};

export default memo(MessageContainer);
