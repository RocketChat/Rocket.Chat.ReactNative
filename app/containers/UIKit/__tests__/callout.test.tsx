import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BlockContext } from '@rocket.chat/ui-kit';

import { Callout } from '../Callout';
import { type IParser } from '../interfaces';

const parser = {
	text: jest.fn((element: any) => <Text>{element.text}</Text>),
	renderActions: jest.fn(() => <Text>accessory</Text>)
} as unknown as IParser;

describe('Callout', () => {
	it('renders title, text and accessory', () => {
		const { getByText } = render(
			<Callout
				title={{ type: 'plain_text', text: 'A title' }}
				text={{ type: 'mrkdwn', text: 'Some text' }}
				variant='danger'
				accessory={{ type: 'button', actionId: 'ok' } as any}
				parser={parser}
			/>
		);
		expect(getByText('A title')).toBeTruthy();
		expect(getByText('Some text')).toBeTruthy();
		expect(getByText('accessory')).toBeTruthy();
		expect(parser.renderActions).toHaveBeenCalledWith(expect.objectContaining({ actionId: 'ok' }), BlockContext.ACTION);
	});

	it('renders without title or accessory', () => {
		const { queryByText } = render(<Callout text={{ type: 'mrkdwn', text: 'Bare' }} parser={parser} />);
		expect(queryByText('Bare')).toBeTruthy();
		expect(queryByText('accessory')).toBeNull();
	});
});
