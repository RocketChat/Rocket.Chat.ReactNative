/* eslint-disable no-undef */
import { themes } from '../../constants/colors';
import { getUnreadStyle } from './getUnreadStyle';

const testsForTheme = (theme) => {
	const getUnreadStyleUtil = ({ ...props }) => getUnreadStyle({ theme, ...props });

	test('render empty', () => {
		expect(getUnreadStyleUtil({})).toEqual({});
	});

	test('render unread', () => {
		expect(getUnreadStyleUtil({
			unread: 1
		})).toEqual({
			backgroundColor: themes[theme].unreadBackground,
			color: themes[theme].buttonText
		});
	});

	test('render thread unread', () => {
		expect(getUnreadStyleUtil({
			tunread: [1]
		})).toEqual({
			backgroundColor: themes[theme].tunreadBackground,
			color: themes[theme].buttonText
		});
	});

	test('render user mention', () => {
		expect(getUnreadStyleUtil({
			unread: 1,
			userMentions: 1
		})).toEqual({
			backgroundColor: themes[theme].mentionMeBackground,
			color: themes[theme].buttonText
		});
	});

	test('render group mention', () => {
		expect(getUnreadStyleUtil({
			unread: 1,
			groupMentions: 1
		})).toEqual({
			backgroundColor: themes[theme].mentionGroupBackground,
			color: themes[theme].buttonText
		});
	});

	test('mentions priority', () => {
		expect(getUnreadStyleUtil({
			unread: 1,
			userMentions: 1,
			groupMentions: 1,
			tunread: [1]
		})).toEqual({
			backgroundColor: themes[theme].mentionMeBackground,
			color: themes[theme].buttonText
		});
		expect(getUnreadStyleUtil({
			unread: 1,
			groupMentions: 1,
			tunread: [1]
		})).toEqual({
			backgroundColor: themes[theme].mentionGroupBackground,
			color: themes[theme].buttonText
		});
		expect(getUnreadStyleUtil({
			unread: 1,
			tunread: [1]
		})).toEqual({
			backgroundColor: themes[theme].tunreadBackground,
			color: themes[theme].buttonText
		});
	});
};

describe('getUnreadStyle light theme', () => testsForTheme('light'));
describe('getUnreadStyle dark theme', () => testsForTheme('dark'));
describe('getUnreadStyle black theme', () => testsForTheme('black'));
