import { inquiryReset } from '../actions/inquiry';
import { routingConfigSuccess } from '../actions/routingConfig';
import { selectServerRequest } from '../../../actions/server';
import routingConfig, { initialState } from './routingConfig';

describe('routingConfig reducer', () => {
	it('stores the server value', () => {
		expect(routingConfig(initialState, routingConfigSuccess(true))).toEqual({ returnQueue: true });
	});

	it('clears the value when a server selection starts', () => {
		expect(routingConfig({ returnQueue: true }, selectServerRequest('https://new.example', '7.0.0'))).toEqual(initialState);
	});

	it('does not change when the inquiry queue resets', () => {
		expect(routingConfig({ returnQueue: true }, inquiryReset())).toEqual({ returnQueue: true });
	});
});
