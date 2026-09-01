import Content from '../Content';
import Attachments from '../Attachments';
import Urls from '../Urls';
import { useAttachments } from '../../stores/MessageStore';

export const ContentLayout = () => {
	const attachments = useAttachments();

	return (
		<>
			<Attachments attachments={attachments} variant='quote' />
			<Content />
			<Attachments attachments={attachments} />
			<Urls />
		</>
	);
};
