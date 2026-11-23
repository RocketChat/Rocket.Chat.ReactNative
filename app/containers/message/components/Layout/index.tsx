import { useResponsiveLayout } from '~/lib/hooks/useResponsiveLayout/useResponsiveLayout';
import BlocksLayout from './BlocksLayout';
import JitsiLayout from './JitsiLayout';
import DiscussionLayout from './DiscussionLayout';
import PreviewLayout from './PreviewLayout';
import StandardLayout from './StandardLayout';
import { useBlocks, useMessageField } from '~/containers/message/stores/MessageStore';

export const Layout = ({ isPreview, isHeader }: { isPreview?: boolean; isHeader: boolean }) => {
	const { isLargeFontScale } = useResponsiveLayout();
	const type = useMessageField(item => item.t);
	const { blocks } = useBlocks();
	const showTimeLarge = isLargeFontScale && isHeader;

	if (blocks && blocks.length) {
		return <BlocksLayout showTimeLarge={showTimeLarge} />;
	}
	if (type === 'jitsi_call_started') {
		return <JitsiLayout showTimeLarge={showTimeLarge} />;
	}
	if (type === 'discussion-created') {
		return <DiscussionLayout showTimeLarge={showTimeLarge} />;
	}
	if (isPreview) {
		return <PreviewLayout showTimeLarge={showTimeLarge} />;
	}
	return <StandardLayout showTimeLarge={showTimeLarge} />;
};
