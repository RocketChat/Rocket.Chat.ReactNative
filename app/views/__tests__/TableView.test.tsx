import { render } from '@testing-library/react-native';
import { parse } from '@rocket.chat/message-parser';

import TableView from '../TableView';

const mockNavigation = { setOptions: jest.fn(), dispatch: jest.fn() };
let mockParams: { value: unknown };

jest.mock('~/lib/hooks/navigation', () => ({
	useAppNavigation: () => mockNavigation,
	useAppRoute: () => ({ params: mockParams })
}));

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

jest.mock('~/lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true])
}));

const renderTableView = (lines: string[]) => {
	const [table] = parse(lines.join('\n'));
	mockParams = { value: table.value };
	return render(<TableView />);
};

describe('TableView', () => {
	it('renders every row of the table', () => {
		const { getByText } = renderTableView(['| N |', '| - |', '| r1 |', '| r2 |', '| r3 |', '| r4 |']);

		['N', 'r1', 'r2', 'r3', 'r4'].forEach(text => expect(getByText(text)).toBeTruthy());
	});

	it('scrolls the table in both directions', () => {
		const { getByTestId } = renderTableView(['| N |', '| - |', '| r1 |']);

		expect(getByTestId('table-view-vertical').props.horizontal).toBeFalsy();
		expect(getByTestId('table-view-horizontal').props.horizontal).toBe(true);
	});

	it('titles the screen Table', () => {
		renderTableView(['| N |', '| - |']);

		expect(mockNavigation.setOptions).toHaveBeenCalledWith(expect.objectContaining({ title: 'Table' }));
	});
});
