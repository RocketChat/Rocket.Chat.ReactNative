import CompactMessage from './CompactMessage';
import FullMessage from './FullMessage';
import { useIsInfoMessage, useMessageIgnored, useThreadPosition } from '../../stores/MessageStore';

export type TMessageProps = {
	isPreview?: boolean;
	highlighted?: boolean;
};

const Message = (props: TMessageProps) => {
	'use memo';

	const { isThreadReply, isThreadSequential } = useThreadPosition();
	const isInfo = useIsInfoMessage();
	const isIgnored = useMessageIgnored();

	if (isThreadReply || isThreadSequential || isInfo || isIgnored) {
		return <CompactMessage />;
	}

	return <FullMessage isPreview={props.isPreview} />;
};

export default Message;
