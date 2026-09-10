import { memo } from 'react';

import MessageTouchable from './components/Touchable/MessageTouchable';
import { type TAnyMessageModel } from '../../definitions';
import MessageSeparator from '../Separator/MessageSeparator';
import { MessageProvider } from './stores/MessageStore';

interface IMessageContainerProps {
	item: TAnyMessageModel;
	previousItem?: TAnyMessageModel;
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
	const { item, previousItem, dateSeparator, showUnreadSeparator } = props;
	return (
		<MessageProvider
			item={item}
			previousItem={previousItem}
			onPress={props.onPress}
			onLongPress={props.onLongPress}
			threadBadgeColor={props.threadBadgeColor}
			isIgnored={props.isIgnored}>
			<MessageTouchable isPreview={props.isPreview} highlighted={props.highlighted} />
			<MessageSeparator ts={dateSeparator} unread={showUnreadSeparator} />
		</MessageProvider>
	);
};

export default memo(MessageContainer);
