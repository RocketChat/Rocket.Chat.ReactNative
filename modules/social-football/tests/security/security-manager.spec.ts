import SecurityManager, {TestableSecurityManager} from '../../src/security/security-manager';
import Apollo from '../../src/apollo';
import {mocked} from 'ts-jest/utils';
import RNUserDefaults from 'rn-user-defaults';

jest.mock('../../src/apollo');
jest.mock('rn-user-defaults');

const mockedApollo = mocked(Apollo, true);
const mockedDefaults = mocked(RNUserDefaults, true);

describe('security manager', () => {
    it('should verify whether a token expired', () => {
        expect(SecurityManager.isTokenExpired({
            exp: (Date.now() / 1000) + 1E6,
        })).toBeFalsy();

        expect(SecurityManager.isTokenExpired({
            exp: (Date.now() / 1000) - 1E6,
        })).toBeTruthy();
    });

    it('should store a token', async () => {
        const spy = spyOn(RNUserDefaults, 'set');

        const accessToken = 'at';
        const refreshToken = 'rt';

        await SecurityManager.storeTokens({ accessToken, refreshToken });

        expect(spy).toHaveBeenCalledWith('accessToken', accessToken);
        expect(spy).toHaveBeenCalledWith('refreshToken', refreshToken);
    });

    it('should clear tokens', async () => {
        const spy = spyOn(RNUserDefaults, 'set');

        await SecurityManager.logout();

        expect(spy).toHaveBeenCalledWith('accessToken', '');
        expect(spy).toHaveBeenCalledWith('refreshToken', '');
    });

    it('should not refresh token when no refresh token was found', async () => {
        mockedDefaults.get.mockImplementation(async () => {
            return null;
        });

        expect(await SecurityManager.refreshToken()).toBeNull();
    });

    it('should not refresh token when a refresh token expired', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1ODIwMTUwNDB9.HCJmdBzAWXl144tdOraBwH2HmyKnJ7N_wZzfLnI9gsg';

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        expect(await SecurityManager.refreshToken()).toBeNull();
    });

    it('should refresh a valid token', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjM1ODIwMTUwNDB9.GqYwRHjcMYo2yN6pjzHei18gl8a4Irh7KmUDlldRQSQ';

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        const at = 'at';

        mockedApollo.mutate.mockImplementation(async () => ({
            data: {
                refreshUsingToken: {
                    accessToken: at,
                    refreshToken: at,
                },
            },
        }));

        const result = await SecurityManager.refreshToken();

        expect(mockedApollo.mutate).toHaveBeenCalled();
        expect(result).toEqual(at);
    });

    it('should refresh a valid token and handle network errors', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjM1ODIwMTUwNDB9.GqYwRHjcMYo2yN6pjzHei18gl8a4Irh7KmUDlldRQSQ';

        const consoleSpy = spyOn(console, 'log');

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        mockedApollo.mutate.mockImplementation(async () => {
            throw new Error();
        });

        await SecurityManager.refreshToken();

        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not return an access token when no refresh access was found', async () => {
        mockedDefaults.get.mockImplementation(async () => {
            return null;
        });

        expect(await SecurityManager.getAccessToken()).toBeNull();
    });

    it('should request a new token when an access token expired', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE1ODIwMTUwNDB9.HCJmdBzAWXl144tdOraBwH2HmyKnJ7N_wZzfLnI9gsg';

        const originalRefreshToken = SecurityManager.refreshToken;
        const refreshFn = jest.fn();

        SecurityManager.refreshToken = refreshFn;

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        await SecurityManager.getAccessToken();

        expect(refreshFn).toHaveBeenCalled();

        SecurityManager.refreshToken = originalRefreshToken;

    });

    it('should return an access token when it is valid', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjM1ODIwMTUwNDB9.GqYwRHjcMYo2yN6pjzHei18gl8a4Irh7KmUDlldRQSQ';

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        expect(await SecurityManager.getAccessToken()).toEqual(token);
    });

    it('should return the decoded user', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjM1ODIwMTUwNDAsInVzZXJuYW1lIjoicm9ib21lc3NpIn0.FCvRHsY5GM5X7NbB3D3X17zU9eHP2v67ha8g6fOnuFI';

        const originalAccessTokenFn = SecurityManager.getAccessToken;
        const accessTokenFn = jest.fn(async () => token);

        SecurityManager.getAccessToken = accessTokenFn;

        const user = await SecurityManager.getUser();

        expect(accessTokenFn).toHaveBeenCalled();
        expect(user?.username).toEqual('robomessi');

        SecurityManager.getAccessToken = originalAccessTokenFn;
    });

    it('should not return the decoded user', async () => {
        const originalAccessTokenFn = SecurityManager.getAccessToken;
        const accessTokenFn = jest.fn(async () => null);

        SecurityManager.getAccessToken = accessTokenFn;

        const user = await SecurityManager.getUser();

        expect(accessTokenFn).toHaveBeenCalled();
        expect(user).toBeNull();

        SecurityManager.getAccessToken = originalAccessTokenFn;
    });

    it('should determine whether a user was authenticated', async () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjM1ODIwMTUwNDAsInVzZXJuYW1lIjoicm9ib21lc3NpIn0.FCvRHsY5GM5X7NbB3D3X17zU9eHP2v67ha8g6fOnuFI';

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        expect(await SecurityManager.isAuthenticated()).toBe(true);
    });

    it('should determine whether a user was not authenticated', async () => {
        mockedDefaults.get.mockImplementation(async () => {
            return null;
        });

        expect(await SecurityManager.isAuthenticated()).toBe(false);
    });

    it('should init correctly', done => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjM1ODIwMTUwNDAsInVzZXJuYW1lIjoicm9ib21lc3NpIn0.FCvRHsY5GM5X7NbB3D3X17zU9eHP2v67ha8g6fOnuFI';
        const manager = new TestableSecurityManager();

        mockedDefaults.get.mockImplementation(async () => {
            return token;
        });

        manager.init().then(_ => {
            manager.login$.subscribe(value => {
                expect(value).toBe(true);
                done();
            });
        });
    });

    it('should update login state', done => {
        const manager = new TestableSecurityManager();

        manager.setLoggedIn(false);

        manager.login$.subscribe(value => {
            expect(value).toBe(false);
            done();
        });
    });
});
