import React from 'react';
import { View, Text } from 'react-native';

import { type TSupportedThemes } from '../../theme';
import { themes } from '../../lib/constants/colors';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import styles from './styles';
import PressableOpacity from '../../containers/PressableOpacity';

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
	<PressableOpacity
		onPress={onPressDetail}
		style={[styles.wrapCannedItem, { backgroundColor: themes[theme].surfaceLight }]}
		android_ripple={{
			color: themes[theme].surfaceNeutral
		}}
		disableOpacityOnAndroid>
		<>
			<View style={styles.cannedRow}>
				<View style={styles.cannedWrapShortcutScope}>
					<Text style={[styles.cannedShortcut, { color: themes[theme].fontTitlesLabels }]}>!{shortcut}</Text>
					<Text style={[styles.cannedScope, { color: themes[theme].fontHint }]}>{scope}</Text>
				</View>

				<Button
					fontSize={12}
					color={themes[theme].fontTitlesLabels}
					title={I18n.t('Use')}
					style={[
						styles.cannedUseButton,
						{
							backgroundColor: themes[theme].surfaceTint,
							paddingVertical: 0, // default padding makes text overflow here
							paddingHorizontal: 0,
							justifyContent: 'center',
							alignItems: 'center'
						}
					]}
					small
					type='secondary'
					onPress={onPressUse}
				/>
			</View>

			<Text ellipsizeMode='tail' numberOfLines={2} style={[styles.cannedText, { color: themes[theme].fontHint }]}>
				“{text}”
			</Text>
			<View style={styles.cannedTagContainer}>
				{tags?.length > 0
					? tags.map(t => (
							<View style={[styles.cannedTagWrap, { backgroundColor: themes[theme].strokeExtraLight }]}>
								<Text style={[styles.cannedTag, { color: themes[theme].fontHint }]}>{t}</Text>
							</View>
					  ))
					: null}
			</View>
		</>
	</PressableOpacity>
);

export default CannedResponseItem;
