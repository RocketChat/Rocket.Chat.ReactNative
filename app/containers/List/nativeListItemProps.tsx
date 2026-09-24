import { type ReactElement } from 'react';

import I18n from '~/i18n';
import EventEmitter from '~/lib/methods/helpers/events';
import { useTheme } from '~/theme';
import { LISTENER } from '../Toast';
import ListIcon from './ListIcon';
import ListItem, { type IListItem } from './ListItem';
import ListRadio from './ListRadio';

export interface INativeListItem extends IListItem {
	title: string;
}

const RadioIcon = ({ isSelected }: { isSelected: boolean }) => {
	const { colors } = useTheme();
	return (
		<ListIcon
			name={isSelected ? 'radio-checked' : 'radio-unchecked'}
			color={isSelected ? colors.badgeBackgroundLevel2 : colors.strokeMedium}
		/>
	);
};

const radioProps = (element: ReactElement<IListItem & { isSelected: boolean }>): IListItem => ({
	title: element.props.title,
	subtitle: element.props.subtitle,
	onPress: element.props.onPress,
	disabled: element.props.disabled,
	disabledReason: element.props.disabledReason,
	testID: element.props.testID,
	translateTitle: element.props.translateTitle,
	translateSubtitle: element.props.translateSubtitle,
	accessibilityLabel: element.props.accessibilityLabel,
	left: element.props.left,
	right: () => <RadioIcon isSelected={element.props.isSelected} />,
	additionalAccessibilityLabel: element.props.isSelected ? I18n.t('Selected') : I18n.t('Unselected')
});

const listItemProps = (element: ReactElement): IListItem | null => {
	if (element.type === ListItem) {
		return element.props as IListItem;
	}
	if (element.type === ListRadio) {
		return radioProps(element as ReactElement<IListItem & { isSelected: boolean }>);
	}
	return null;
};

export const toNativeListItem = (element: ReactElement): INativeListItem | null => {
	const props = listItemProps(element);
	return props && typeof props.title === 'string' ? (props as INativeListItem) : null;
};

const translate = (text: string, shouldTranslate = true) => (shouldTranslate ? I18n.t(text) : text);

export const nativeListItemTitle = ({ title, translateTitle }: INativeListItem) => translate(title, translateTitle);

export const nativeListItemSubtitle = ({ subtitle, translateSubtitle }: INativeListItem) =>
	subtitle ? translate(subtitle, translateSubtitle) : undefined;

const stateLabel = ({ additionalAccessibilityLabel, additionalAccessibilityLabelCheck }: INativeListItem) => {
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

export const nativeListItemAccessibilityLabel = (item: INativeListItem) =>
	item.accessibilityLabel ??
	[nativeListItemTitle(item), nativeListItemSubtitle(item), stateLabel(item)].filter(Boolean).join(' ');

export const pressNativeListItem = ({ disabled, disabledReason, onPress, title }: INativeListItem) => {
	if (disabled && disabledReason) {
		EventEmitter.emit(LISTENER, { message: disabledReason });
		return;
	}
	if (!disabled) {
		onPress?.(title);
	}
};
