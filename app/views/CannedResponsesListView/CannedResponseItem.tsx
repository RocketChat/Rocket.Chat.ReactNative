import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import styles from './styles';

interface ICannedResponseItem {
	theme: TSupportedThemes;
	onPressDetail: () => void;
	shortcut: string;
	scope: string;
	onPressUse: () => void;
	text: string;
	tags?: string[];
}

const CannedResponseItem = ({
	theme,
	onPressDetail = () => {},
	shortcut,
	scope,
	onPressUse = () => {},
	text,
	tags = []
}: ICannedResponseItem): JSX.Element => (
	<Touchable onPress={onPressDetail} style={[styles.wrapCannedItem, { backgroundColor: themes[theme].messageboxBackground }]}>
		<>
			<View style={styles.cannedRow}>
				<View style={styles.cannedWrapShortcutScope}>
					<Text style={[styles.cannedShortcut, { color: themes[theme].titleText }]}>!{shortcut}</Text>
					<Text style={[styles.cannedScope, { color: themes[theme].auxiliaryTintColor }]}>{scope}</Text>
				</View>

				<Button
					title={I18n.t('Use')}
					fontSize={12}
					color={themes[theme].titleText}
					style={[styles.cannedUseButton, { backgroundColor: themes[theme].chatComponentBackground }]}
					onPress={onPressUse}
				/>
			</View>

			<Text ellipsizeMode='tail' numberOfLines={2} style={[styles.cannedText, { color: themes[theme].auxiliaryTintColor }]}>
				“{text}”
			</Text>
			<View style={styles.cannedTagContainer}>
				{tags?.length > 0
					? tags.map(t => (
							<View style={[styles.cannedTagWrap, { backgroundColor: themes[theme].searchboxBackground }]}>
								<Text style={[styles.cannedTag, { color: themes[theme].auxiliaryTintColor }]}>{t}</Text>
							</View>
					  ))
					: null}
			</View>
		</>
	</Touchable>
);

export default CannedResponseItem;
