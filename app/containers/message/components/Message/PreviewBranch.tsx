import User from '../User';
import Content from '../Content';
import Attachments from '../Attachments';
import Quote from '../Attachments/Quote';
import Urls from '../Urls';
import MessageTime from '../Time';
import { useAttachments, useMessageAuthor } from '../../stores/MessageStore';

const PreviewBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	const attachments = useAttachments();
	const { u: author } = useMessageAuthor();

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<Quote attachments={attachments} />
			<Content />
			<Attachments attachments={attachments} author={author} />
			<Urls />
		</>
	);
};

PreviewBranch.displayName = 'MessagePreviewBranch';

export default PreviewBranch;
