import i18n from '../../../i18n';
import { type IMessageThread } from '../interfaces';

export const useMessageAccessibilityHint = (
	props: Pick<IMessageThread, 'tlm' | 'tcount' | 'isThreadRoom'>
): string | undefined => {
	'use memo';

	const hasThread = !!props.tlm && !props.isThreadRoom && props.tcount !== null;
	return hasThread ? i18n.t('A11y_press_to_view_thread') : undefined;
};
