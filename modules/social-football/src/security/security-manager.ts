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

    private async refreshToken(): Promise<string|null> {
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

    public async logout() {
        await RNUserDefaults.set(SecurityManager.ACCESS_TOKEN_KEY, '');
        await RNUserDefaults.set(SecurityManager.REFRESH_TOKEN_KEY, '');

        this.loginSubject.next(false);
    }

    public async storeTokens(pair: TokenPair) {
        console.info('Storing tokens.');

        await RNUserDefaults.set(SecurityManager.ACCESS_TOKEN_KEY, pair.accessToken);
        await RNUserDefaults.set(SecurityManager.REFRESH_TOKEN_KEY, pair.refreshToken);

        console.info('Stored tokens.');
    }

    public setLoggedIn(value: boolean) {
        this.loginSubject.next(true);
    }

    private isTokenExpired(payload: any) {
        return (Date.now() / 1000) > payload.exp;
    }
}

export default new SecurityManager();
