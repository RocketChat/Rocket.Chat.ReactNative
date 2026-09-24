import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { LISTENER } from '../Toast';
import { type IListItem } from './ListItem';

export const translateListText = (text: string, shouldTranslate = true) => (shouldTranslate ? I18n.t(text) : text);

export const nativeListItemTitle = ({ title, translateTitle }: IListItem) =>
	typeof title === 'string' ? translateListText(title, translateTitle) : undefined;

export const nativeListItemSubtitle = ({ subtitle, translateSubtitle }: IListItem) =>
	subtitle ? translateListText(subtitle, translateSubtitle) : undefined;

const stateLabel = ({ additionalAccessibilityLabel, additionalAccessibilityLabelCheck }: IListItem) => {
	if (typeof additionalAccessibilityLabel === 'string') {
		return additionalAccessibilityLabel;
	}
	if (typeof additionalAccessibilityLabel !== 'boolean') {
		return undefined;
	}
	if (additionalAccessibilityLabelCheck) {
		return I18n.t(additionalAccessibilityLabel ? 'Checked' : 'Unchecked');
	}
	return I18n.t(additionalAccessibilityLabel ? 'Enabled' : 'Disabled');
};

export const nativeListItemAccessibilityLabel = (item: IListItem) =>
	item.accessibilityLabel ??
	[nativeListItemTitle(item), nativeListItemSubtitle(item), stateLabel(item)].filter(Boolean).join(' ');

export const pressNativeListItem = ({ disabled, disabledReason, onPress, title }: IListItem) => {
	if (disabled && disabledReason) {
		EventEmitter.emit(LISTENER, { message: disabledReason });
		return;
	}
	if (!disabled) {
		onPress?.(title);
	}
};
