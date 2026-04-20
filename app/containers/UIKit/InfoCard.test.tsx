import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { InfoCard } from './InfoCard';

jest.mock('../../theme', () => ({
	useTheme: () => ({
		colors: {
			surfaceTint: '#f7f7f7',
			strokeExtraLight: '#e1e1e1',
			surfaceLight: '#ffffff'
		}
	})
}));

describe('InfoCard', () => {
	it('renders row elements in order and applies row background', () => {
		const parser = {
			icon: jest.fn((element: any) => <Text>{`icon:${element.icon}`}</Text>),
			plain_text: jest.fn((element: any) => <Text>{`text:${element.text}`}</Text>),
			mrkdwn: jest.fn((element: any) => <Text>{`md:${element.text}`}</Text>),
			icon_button: jest.fn(() => <Text>action</Text>)
		};

		const { getByText, toJSON, UNSAFE_getAllByType } = render(
			<InfoCard
				type='info_card'
				parser={parser as any}
				blockId='info-card'
				rows={[
					{
						background: 'default',
						elements: [
							{ type: 'icon', icon: 'info', variant: 'default' },
							{ type: 'plain_text', text: 'Plain text' },
							{ type: 'mrkdwn', text: '*Markdown*' }
						]
					}
				]}
			/>
		);

		expect(getByText('icon:info')).toBeTruthy();
		expect(getByText('text:Plain text')).toBeTruthy();
		expect(getByText('md:*Markdown*')).toBeTruthy();

		const allTexts = UNSAFE_getAllByType(Text).map(node => node.props.children);
		expect(allTexts).toEqual(expect.arrayContaining(['icon:info', 'text:Plain text', 'md:*Markdown*']));

		expect(toJSON()).toMatchObject({
			children: expect.arrayContaining([
				expect.objectContaining({
					props: {
						style: expect.arrayContaining([expect.objectContaining({ backgroundColor: '#ffffff' })])
					}
				})
			])
		});
	});

	it('ignores row action rendering for now (non-interactive)', () => {
		const parser = {
			icon: jest.fn((element: any) => <Text>{`icon:${element.icon}`}</Text>),
			plain_text: jest.fn((element: any) => <Text>{`text:${element.text}`}</Text>),
			mrkdwn: jest.fn((element: any) => <Text>{`md:${element.text}`}</Text>),
			icon_button: jest.fn(() => <Text>action</Text>)
		};

		const { queryByText } = render(
			<InfoCard
				type='info_card'
				parser={parser as any}
				rows={[
					{
						background: 'default',
						elements: [{ type: 'plain_text', text: 'Line' }],
						action: {
							type: 'icon_button',
							actionId: 'act-id',
							icon: { type: 'icon', icon: 'phone' }
						} as any
					}
				]}
			/>
		);

		expect(queryByText('text:Line')).toBeTruthy();
		expect(queryByText('action')).toBeNull();
		expect(parser.icon_button).not.toHaveBeenCalled();
	});
});
