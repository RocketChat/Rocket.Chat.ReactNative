import gql from 'graphql-tag';

export const LOGIN = gql`
    mutation LoginApp($credentials: UserCredentials!) {
        loginApp(credentials: $credentials) {
            accessToken,
            refreshToken,
        }
    }
`;

export const REGISTER = gql`
    mutation RegisterApp($user: User!) {
        register(user: $user) {
            accessToken,
            refreshToken,
        }
    }
`;

export const REFRESH_USING_TOKEN = gql`
    mutation RefreshUsingToken($refreshToken: String!) {
        refreshUsingToken(refreshToken: $refreshToken) {
            accessToken,
            refreshToken,
        }
    }
`;

