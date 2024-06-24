/* eslint-disable no-undef */
import { themes } from '../../lib/constants';
import { getUnreadStyle } from './getUnreadStyle';

const testsForTheme = theme => {
	const getUnreadStyleUtil = ({ ...props }) => getUnreadStyle({ theme, ...props });

	test('render empty', () => {
		expect(getUnreadStyleUtil({})).toEqual({});
	});

	test('render unread', () => {
		expect(
			getUnreadStyleUtil({
				unread: 1
			})
		).toEqual({
			backgroundColor: themes[theme].fontAnnotation,
			color: themes[theme].fontWhite
		});
	});

	test('render thread unread', () => {
		expect(
			getUnreadStyleUtil({
				tunread: [1]
			})
		).toEqual({
			backgroundColor: theme === 'light' ? themes[theme].fontInfo : themes[theme].buttonBackgroundPrimaryPress,
			color: themes[theme].fontWhite
		});
	});

	test('render user mention', () => {
		expect(
			getUnreadStyleUtil({
				unread: 1,
				userMentions: 1
			})
		).toEqual({
			backgroundColor: themes[theme].badgeBackgroundLevel4,
			color: themes[theme].fontWhite
		});
	});

	test('render group mention', () => {
		expect(
			getUnreadStyleUtil({
				unread: 1,
				groupMentions: 1
			})
		).toEqual({
			backgroundColor: themes[theme].badgeBackgroundLevel3,
			color: themes[theme].fontWhite
		});
	});

	test('mentions priority', () => {
		expect(
			getUnreadStyleUtil({
				unread: 1,
				userMentions: 1,
				groupMentions: 1,
				tunread: [1]
			})
		).toEqual({
			backgroundColor: themes[theme].badgeBackgroundLevel4,
			color: themes[theme].fontWhite
		});
		expect(
			getUnreadStyleUtil({
				unread: 1,
				groupMentions: 1,
				tunread: [1]
			})
		).toEqual({
			backgroundColor: themes[theme].badgeBackgroundLevel3,
			color: themes[theme].fontWhite
		});
		expect(
			getUnreadStyleUtil({
				unread: 1,
				tunread: [1]
			})
		).toEqual({
			backgroundColor: theme === 'light' ? themes[theme].fontInfo : themes[theme].buttonBackgroundPrimaryPress,
			color: themes[theme].fontWhite
		});
	});
};

describe('getUnreadStyle light theme', () => {
	testsForTheme('light');
});
describe('getUnreadStyle dark theme', () => {
	testsForTheme('dark');
});
describe('getUnreadStyle black theme', () => {
	testsForTheme('black');
});
