import User from '../User';
import MessageTime from '../Time';
import { AttachmentLayout } from './AttachmentLayout';

const PreviewLayout = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<AttachmentLayout />
		</>
	);
};

export default PreviewLayout;
