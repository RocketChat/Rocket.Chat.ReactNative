import { StyleSheet } from 'react-native';

import { PADDING_HORIZONTAL } from '../constants';

export const ROW_MIN_HEIGHT = 52;
const CARD_MARGIN_HORIZONTAL = 16;
const CARD_RADIUS = 26;
const TEXT_MARGIN_HORIZONTAL = CARD_MARGIN_HORIZONTAL * 2;
const SECTION_SPACING = 35;
const SECTION_SPACING_BELOW_CARD = 17.5;
const LAST_SECTION_SPACING = 20;
const TITLE_LINE_SPACING = 2;
const NATIVE_TEXT_LINE_HEIGHT = 61 / 3;
const TITLE_LINE_HEIGHT = NATIVE_TEXT_LINE_HEIGHT + TITLE_LINE_SPACING;

export default StyleSheet.create({
	content: {
		paddingBottom: LAST_SECTION_SPACING - SECTION_SPACING_BELOW_CARD
	},
	firstSectionSpacer: {
		height: SECTION_SPACING
	},
	sectionSpacer: {
		height: SECTION_SPACING - SECTION_SPACING_BELOW_CARD
	},
	belowCardSpacer: {
		height: SECTION_SPACING_BELOW_CARD
	},
	header: {
		paddingVertical: 10,
		marginHorizontal: TEXT_MARGIN_HORIZONTAL,
		fontSize: 17,
		lineHeight: NATIVE_TEXT_LINE_HEIGHT,
		fontWeight: '600'
	},
	footer: {
		paddingTop: 23 / 3,
		paddingBottom: 6,
		marginHorizontal: TEXT_MARGIN_HORIZONTAL,
		fontSize: 13,
		lineHeight: 16
	},
	card: {
		marginHorizontal: CARD_MARGIN_HORIZONTAL,
		borderRadius: CARD_RADIUS,
		borderCurve: 'continuous',
		overflow: 'hidden'
	},
	separator: {
		position: 'absolute',
		bottom: 0,
		left: PADDING_HORIZONTAL,
		right: CARD_MARGIN_HORIZONTAL,
		height: 1
	},
	title: {
		lineHeight: TITLE_LINE_HEIGHT,
		marginVertical: -TITLE_LINE_SPACING / 2
	},
	rowContainer: {
		minHeight: ROW_MIN_HEIGHT,
		justifyContent: 'center'
	},
	row: {
		paddingHorizontal: PADDING_HORIZONTAL
	},
	disabled: {
		opacity: 0.3
	},
	accessoryText: {
		fontSize: 17
	}
});
