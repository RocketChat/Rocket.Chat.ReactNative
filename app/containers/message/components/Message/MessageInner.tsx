import { WidthAwareView } from '../WidthAwareView';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import BlocksBranch from './BlocksBranch';
import JitsiBranch from './JitsiBranch';
import DiscussionBranch from './DiscussionBranch';
import PreviewBranch from './PreviewBranch';
import DefaultBranch from './DefaultBranch';
import { useBlocks, useMessageField } from '../../stores/MessageStore';

export const MessageInner = ({ isPreview, isHeader }: { isPreview?: boolean; isHeader: boolean }) => {
	'use memo';

	const { isLargeFontScale } = useResponsiveLayout();
	const type = useMessageField(item => item.t);
	const { blocks } = useBlocks();
	const showTimeLarge = isLargeFontScale && isHeader;

	let branch;
	if (blocks && blocks.length) {
		branch = <BlocksBranch showTimeLarge={showTimeLarge} />;
	} else if (type === 'jitsi_call_started') {
		branch = <JitsiBranch showTimeLarge={showTimeLarge} />;
	} else if (type === 'discussion-created') {
		branch = <DiscussionBranch showTimeLarge={showTimeLarge} />;
	} else if (isPreview) {
		branch = <PreviewBranch showTimeLarge={showTimeLarge} />;
	} else {
		branch = <DefaultBranch showTimeLarge={showTimeLarge} />;
	}

	return <WidthAwareView>{branch}</WidthAwareView>;
};
MessageInner.displayName = 'MessageInner';
