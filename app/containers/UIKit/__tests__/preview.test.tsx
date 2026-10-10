import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { Preview } from '../Preview';
import { type IParser } from '../interfaces';

const parser = {
	text: jest.fn((element: any) => <Text>{element.text}</Text>),
	renderContext: jest.fn(() => <Text>footer</Text>)
} as unknown as IParser;

describe('Preview', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('renders title, description, cover and footer', () => {
		const { getByText } = render(
			<Preview
				title={[{ type: 'plain_text', text: 'A title' }]}
				description={[{ type: 'mrkdwn', text: 'A description' }]}
				thumb={{ url: 'https://example.com/thumb.png' }}
				footer={{ elements: [{ type: 'mrkdwn', text: 'A footer' } as any] }}
				parser={parser}
			/>
		);
		expect(getByText('A title')).toBeTruthy();
		expect(getByText('A description')).toBeTruthy();
		expect(getByText('footer')).toBeTruthy();
	});

	it('renders without optional parts', () => {
		const { queryByText } = render(<Preview description={[{ type: 'mrkdwn', text: 'Only description' }]} parser={parser} />);
		expect(queryByText('Only description')).toBeTruthy();
		expect(parser.renderContext).not.toHaveBeenCalled();
	});
});
