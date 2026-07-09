import Content from '../Content';
import Attachments from '../Attachments';
import Quote from '../Attachments/Quote';
import Urls from '../Urls';
import { useAttachments, useMessageField } from '../../stores/MessageStore';

export const ContentLayout = () => {
	'use memo';

	const attachments = useAttachments();
	const author = useMessageField(item => item.u);

	return (
		<>
			<Quote attachments={attachments} />
			<Content />
			<Attachments attachments={attachments} author={author} />
			<Urls />
		</>
	);
};
