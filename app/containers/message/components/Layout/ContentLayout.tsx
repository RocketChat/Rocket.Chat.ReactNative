import Content from '../Content';
import Attachments from '../Attachments';
import Quote from '../Attachments/Quote';
import Urls from '../Urls';
import { useAttachments } from '../../stores/MessageStore';

export const ContentLayout = () => {
	'use memo';

	const attachments = useAttachments();

	return (
		<>
			<Quote attachments={attachments} />
			<Content />
			<Attachments attachments={attachments} />
			<Urls />
		</>
	);
};
