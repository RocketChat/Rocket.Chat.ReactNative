import User from '../User';
import MessageTime from '../Time';
import { BranchAttachmentContent } from './BranchAttachmentContent';

const PreviewBranch = ({ showTimeLarge }: { showTimeLarge: boolean }) => {
	'use memo';

	return (
		<>
			<User />
			{showTimeLarge ? <MessageTime /> : null}
			<BranchAttachmentContent />
		</>
	);
};

PreviewBranch.displayName = 'MessagePreviewBranch';

export default PreviewBranch;
