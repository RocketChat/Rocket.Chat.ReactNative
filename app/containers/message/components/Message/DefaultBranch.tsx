import { View } from 'react-native';

import User from '../User';
import Content from '../Content';
import Attachments from '../Attachments';
import Quote from '../Attachments/Quote';
import Urls from '../Urls';
import Thread from '../Thread';
import Reactions from '../Reactions';
import Broadcast from '../Broadcast';
import MessageTime from '../Time';
import { useAttachments, useMessageField } from '../../stores/MessageStore';

const DefaultBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	const attachments = useAttachments();
	const author = useMessageField(item => item.u);

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<View style={{ gap: 4 }}>
				<Quote attachments={attachments} />
				<Content />
				<Attachments attachments={attachments} author={author} />
				<Urls />
				<Thread />
				<Reactions />
				<Broadcast />
			</View>
		</>
	);
};

DefaultBranch.displayName = 'MessageDefaultBranch';

export default DefaultBranch;
