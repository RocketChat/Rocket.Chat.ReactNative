import gql from 'graphql-tag';

/**
 * Login to the Application.
 * 
 * @param UserCredentials
 * @returns {accessToken, refreshToken} if UserCredentials are Valid
 * @returns {error} if UserCredentials are Invalid
 */
export const LOGIN = gql`
    mutation LoginApp($credentials: UserCredentials!) {
        loginApp(credentials: $credentials) {
            accessToken,
            refreshToken,
        }
    }
`;

/**
 * Register with the Application.
 * 
 * @param User
 * @returns {accessToken, refreshToken} if User is new
 * @returns {error} if User already exists
 */
export const REGISTER = gql`
    mutation RegisterApp($user: User!) {
        register(user: $user) {
            accessToken,
            refreshToken,
        }
    }
`;

/**
 * Get new Tokens from the Server.
 * 
 * @param String
 * @returns {accessToken, refreshToken}
 */
export const REFRESH_USING_TOKEN = gql`
    mutation RefreshUsingToken($refreshToken: String!) {
        refreshUsingToken(refreshToken: $refreshToken) {
            accessToken,
            refreshToken,
        }
    }
`;

