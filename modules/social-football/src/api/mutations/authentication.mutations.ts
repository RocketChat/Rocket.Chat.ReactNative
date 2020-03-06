import gql from 'graphql-tag';

/**
 * Login to the Application.
 * 
 * @param UserCredentials
 * @returns {loginApp<credentials>} if UserCredentials are Valid
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
 * @returns {register<user>} if User is new
 * @returns {error} if User already exists
 */
export const REGISTER = gql`
    mutation RegisterApp($user: UserInput!) {
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
 * @returns {refreshUsingToken<refreshToken>}
 */
export const REFRESH_USING_TOKEN = gql`
    mutation RefreshUsingToken($refreshToken: String!) {
        refreshUsingToken(refreshToken: $refreshToken) {
            accessToken,
            refreshToken,
        }
    }
`;

