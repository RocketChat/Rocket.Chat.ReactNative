import SecurityManager from '../src/security/security-manager';
import {mocked} from 'ts-jest/utils';
import {authLink, authLinkProcessor, cacheKeyGenerator} from '../src/apollo';

jest.mock('../src/security/security-manager');

const mockedSecurity = mocked(SecurityManager, true);

describe('graphql client', () => {
    it('should provide a authorization token', async () => {
        mockedSecurity.getAccessToken.mockImplementation(async () => 'testtoken');

        expect(authLink).toBeTruthy();

        const result = await authLinkProcessor(null, { headers: { }});
        expect(result.headers.authorization).toEqual('Bearer testtoken');
    });

    it('should not provide a authorization token if not found', async () => {
        mockedSecurity.getAccessToken.mockImplementation(async () => null);

        expect(authLink).toBeTruthy();

        const result = await authLinkProcessor(null, { headers: { }});
        expect(result.headers.authorization).toBe('');
    });

    it('should not provide a authorization token if the request is getting a request token', async () => {
        expect(authLink).toBeTruthy();

        const result = await authLinkProcessor({ operationName: 'RefreshUsingToken' }, { headers: { }});
        expect(result.headers.authorization).toBeUndefined();
    });

    it('should generate a cache key', () => {
        const entity = { _id: 'test' };

        expect(cacheKeyGenerator(entity)).toEqual('test');
    });
});
