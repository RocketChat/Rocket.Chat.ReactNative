import Message from './index';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { getUserSelector } from '../../selectors/login';
import { type TAnyMessageModel } from '../../definitions';

const MessagePreview = ({ message }: { message: TAnyMessageModel }) => {
	'use memo';

	const { user, baseUrl, Message_TimeFormat, useRealName } = useAppSelector(state => ({
		user: getUserSelector(state),
		baseUrl: state.server.server,
		Message_TimeFormat: state.settings.Message_TimeFormat as string,
		useRealName: state.settings.UI_Use_Real_Name as boolean
	}));

	return (
		<Message
			item={message}
			user={user}
			rid={message.rid}
			baseUrl={baseUrl}
			timeFormat={Message_TimeFormat}
			useRealName={useRealName}
			isPreview
		/>
	);
};

export default MessagePreview;
