import { determineAuthType, getLoginServices } from './connect';
import { setLoginServices } from '../../actions/login';

jest.mock('./voip/MediaSessionInstance', () => ({
	mediaSessionInstance: { reset: jest.fn() }
}));

jest.mock('../methods/helpers/deviceInfo', () => ({
	...jest.requireActual('../methods/helpers/deviceInfo'),
	isIOS: true
}));

const mockStoreDispatch = jest.fn();
jest.mock('../store/auxStore', () => ({
	store: {
		dispatch: (action: unknown) => mockStoreDispatch(action),
		getState: jest.fn()
	}
}));

interface IServices {
	[index: string]: string | boolean;
	name: string;
	custom: boolean;
	showButton: boolean;
	buttonLabelText: string;
	service: string;
}

describe('determineAuthType - iOS specific tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('apple authentication when isIOS is true', () => {
		it('should return apple when authName is apple and isIOS is true', () => {
			const services: IServices = {
				name: 'apple',
				custom: false,
				showButton: true,
				buttonLabelText: 'Apple Login',
				service: 'apple'
			};

			const result = determineAuthType(services);
			expect(result).toBe('apple');
		});

		it('should return apple when service is apple and name is empty but isIOS is true', () => {
			const services: IServices = {
				name: '',
				custom: false,
				showButton: true,
				buttonLabelText: 'Apple Login',
				service: 'apple'
			};

			const result = determineAuthType(services);
			expect(result).toBe('apple');
		});

		it('should return apple when name is apple even if service is different', () => {
			const services: IServices = {
				name: 'apple',
				custom: false,
				showButton: true,
				buttonLabelText: 'Apple Login',
				service: 'some-other-service'
			};

			const result = determineAuthType(services);
			expect(result).toBe('apple');
		});

		it('should prioritize oauth_custom over apple when custom is true', () => {
			const services: IServices = {
				name: 'apple',
				custom: true,
				showButton: true,
				buttonLabelText: 'Custom Apple Login',
				service: 'apple'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth_custom'); // Should return oauth_custom first
		});

		it('should prioritize saml over apple when service is saml', () => {
			const services: IServices = {
				name: 'apple',
				custom: false,
				showButton: true,
				buttonLabelText: 'SAML Apple Login',
				service: 'saml'
			};

			const result = determineAuthType(services);
			expect(result).toBe('saml'); // Should return saml before checking for apple
		});

		it('should prioritize cas over apple when service is cas', () => {
			const services: IServices = {
				name: 'apple',
				custom: false,
				showButton: true,
				buttonLabelText: 'CAS Apple Login',
				service: 'cas'
			};

			const result = determineAuthType(services);
			expect(result).toBe('cas'); // Should return cas before checking for apple
		});

		it('should not return oauth_custom when custom is true but showButton is false', () => {
			const services: IServices = {
				name: 'apple',
				custom: true,
				showButton: false,
				buttonLabelText: 'Apple Login',
				service: 'apple'
			};

			const result = determineAuthType(services);
			expect(result).toBe('apple'); // Should continue to apple auth since oauth_custom condition fails
		});
	});

	describe('other auth types still work when isIOS is true', () => {
		it('should return oauth for facebook service', () => {
			const services: IServices = {
				name: 'facebook',
				custom: false,
				showButton: true,
				buttonLabelText: 'Facebook Login',
				service: 'facebook'
			};

			const result = determineAuthType(services);
			expect(result).toBe('oauth');
		});

		it('should return not_supported for unknown service', () => {
			const services: IServices = {
				name: 'unknown-service',
				custom: false,
				showButton: true,
				buttonLabelText: 'Unknown Login',
				service: 'unknown'
			};

			const result = determineAuthType(services);
			expect(result).toBe('not_supported');
		});
	});

	describe('getLoginServices', () => {
		const originalFetch = global.fetch;

		afterEach(() => {
			global.fetch = originalFetch;
		});

		it('should correctly map Apple OAuth with service name "apple" instead of buttonLabelText', async () => {
			global.fetch = jest.fn().mockResolvedValue({
				json: jest.fn().mockResolvedValue({
					success: true,
					services: [
						{
							_id: 'Accounts_OAuth_Apple',
							service: 'apple',
							buttonLabelText: 'Sign in with Apple',
							buttonColor: '#000',
							buttonLabelColor: '#FFF',
							custom: false
						}
					]
				})
			}) as any;

			await getLoginServices('https://open.rocket.chat');

			expect(mockStoreDispatch).toHaveBeenCalledWith(
				setLoginServices({
					apple: {
						_id: 'Accounts_OAuth_Apple',
						service: 'apple',
						buttonLabelText: 'Sign in with Apple',
						buttonColor: '#000',
						buttonLabelColor: '#FFF',
						custom: false,
						name: 'apple',
						authType: 'apple'
					}
				})
			);
		});

		it('should correctly map standard OAuth providers', async () => {
			global.fetch = jest.fn().mockResolvedValue({
				json: jest.fn().mockResolvedValue({
					success: true,
					services: [
						{
							_id: 'Accounts_OAuth_Google',
							service: 'google',
							buttonLabelText: '',
							custom: false
						}
					]
				})
			}) as any;

			await getLoginServices('https://open.rocket.chat');

			expect(mockStoreDispatch).toHaveBeenCalledWith(
				setLoginServices({
					google: {
						_id: 'Accounts_OAuth_Google',
						service: 'google',
						buttonLabelText: '',
						custom: false,
						name: 'google',
						authType: 'oauth'
					}
				})
			);
		});

		it('should dispatch empty object when server returns no services or failure', async () => {
			global.fetch = jest.fn().mockResolvedValue({
				json: jest.fn().mockResolvedValue({
					success: false
				})
			}) as any;

			await getLoginServices('https://open.rocket.chat');

			expect(mockStoreDispatch).toHaveBeenCalledWith(setLoginServices({}));
		});
	});
});
