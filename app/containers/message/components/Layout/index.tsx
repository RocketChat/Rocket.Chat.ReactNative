import { WidthAwareView } from '../WidthAwareView';
import { useResponsiveLayout } from '../../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';
import BlocksLayout from './BlocksLayout';
import JitsiLayout from './JitsiLayout';
import DiscussionLayout from './DiscussionLayout';
import PreviewLayout from './PreviewLayout';
import StandardLayout from './StandardLayout';
import { useBlocks, useMessageField } from '../../stores/MessageStore';

export const Layout = ({ isPreview, isHeader }: { isPreview?: boolean; isHeader: boolean }) => {
	const { isLargeFontScale } = useResponsiveLayout();
	const type = useMessageField(item => item.t);
	const { blocks } = useBlocks();
	const showTimeLarge = isLargeFontScale && isHeader;

	let layout;
	if (blocks && blocks.length) {
		layout = <BlocksLayout showTimeLarge={showTimeLarge} />;
	} else if (type === 'jitsi_call_started') {
		layout = <JitsiLayout showTimeLarge={showTimeLarge} />;
	} else if (type === 'discussion-created') {
		layout = <DiscussionLayout showTimeLarge={showTimeLarge} />;
	} else if (isPreview) {
		layout = <PreviewLayout showTimeLarge={showTimeLarge} />;
	} else {
		layout = <StandardLayout showTimeLarge={showTimeLarge} />;
	}

	return <WidthAwareView>{layout}</WidthAwareView>;
};
