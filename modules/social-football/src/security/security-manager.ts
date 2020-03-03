import jwtDecode from 'jwt-decode';
import RNUserDefaults from 'rn-user-defaults';
import Apollo from '../apollo';
import { TokenPayload } from './models/token-payload';
import { TokenPair } from './models/token-pair';
import { REFRESH_USING_TOKEN } from '../api/mutations/authentication.mutations';
import { BehaviorSubject } from 'rxjs';

class SecurityManager {
    private static readonly ACCESS_TOKEN_KEY = 'accessToken';
    private static readonly REFRESH_TOKEN_KEY = 'refreshToken';

    private loginSubject = new BehaviorSubject<boolean|null>(null);
    public login$ = this.loginSubject.asObservable();

    public async init() {
        this.loginSubject.next(!!(await this.getAccessToken()));
    }

    /**
     * Requests an accessToken. 
     * Returns an error message when the request fails.
     *
     * @returns {(Promise<string|null>)}
     * @memberof SecurityManager
     */
    public async getAccessToken(): Promise<string|null> {
        const accessToken = await RNUserDefaults.get(SecurityManager.ACCESS_TOKEN_KEY);

        console.info('[info] Found access token', accessToken);

        if (accessToken) {
            const payload = jwtDecode(accessToken);

            if (!this.isTokenExpired(payload)) {
                console.info('[info] Access token valid', payload);

                return accessToken;
            } else {
                console.info('[info] Access token expired, renewing.');

                return await this.refreshToken();
            }
        }

        return null;
    }

    /**
     * If there is an accesstoken request the User.
     * Otherwise, return nothing.
     *
     * @returns {(Promise<TokenPayload|null>)}
     * @memberof SecurityManager
     */
    public async getUser(): Promise<TokenPayload|null> {
        const accessToken = await this.getAccessToken();

        if (accessToken) {
            return jwtDecode(accessToken);
        }

        return null;
    }

    public async isAuthenticated() {
        return !!(await this.getUser());
    }

    /**
     * Requests refreshtoken. 
     * Returns an error message when the request fails.
     * Renew the refreshtoken when it is expired.
     *
     * @returns {(Promise<string|null>)}
     * @memberof SecurityManager
     */
    public async refreshToken(): Promise<string|null> {
        const refreshToken = await RNUserDefaults.get(SecurityManager.REFRESH_TOKEN_KEY);

        if (refreshToken) {
            console.info('[info] Refresh token found.', refreshToken);

            const payload = jwtDecode(refreshToken);

            if (!this.isTokenExpired(payload)) {
                console.info('[info] Refresh token not expired.');

                try {
                    const renewToken = await Apollo.mutate<{ refreshUsingToken: TokenPair }>({
                        mutation: REFRESH_USING_TOKEN,
                        variables: {
                            refreshToken
                        }
                    });

                    const tokens = renewToken.data?.refreshUsingToken!;
                    this.storeTokens(tokens);

                    console.info('[info] Got new token pair.', tokens);

                    return tokens.accessToken;
                } catch (error) {
                    console.log(error);
                }
            }
        }

        return null;
    }

    /**
     * Resets the Accesstoken and Refreshtoken.
     *
     * @memberof SecurityManager
     */
    public async logout() {
        await RNUserDefaults.set(SecurityManager.ACCESS_TOKEN_KEY, '');
        await RNUserDefaults.set(SecurityManager.REFRESH_TOKEN_KEY, '');

        await Apollo.cache.reset();
        this.loginSubject.next(false);
    }

    /**
     * Store the accesstoken and refreshtoken.
     *
     * @param {TokenPair} pair
     * @memberof SecurityManager
     */
    public async storeTokens(pair: TokenPair) {
        console.info('Storing tokens.');

        await RNUserDefaults.set(SecurityManager.ACCESS_TOKEN_KEY, pair.accessToken);
        await RNUserDefaults.set(SecurityManager.REFRESH_TOKEN_KEY, pair.refreshToken);

        console.info('Stored tokens.');
    }

    /**
     * Check if the user is logged-in.
     *
     * @param {*} value
     * @returns bool
     * @memberof SecurityManager
     */
    public setLoggedIn(value: boolean) {
        this.loginSubject.next(value);
    }

    /**
     * Check if the token is expired or not.
     *
     * @param {*} payload
     * @returns bool
     * @memberof SecurityManager
     */
    public isTokenExpired(payload: any) {
        return (Date.now() / 1000) > payload.exp;
    }
}

export { SecurityManager as TestableSecurityManager };
export default new SecurityManager();
