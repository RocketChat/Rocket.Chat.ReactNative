/**
 * Defining the needed information for a Token.
 */

export interface TokenPayload {
    username: string;
    userId: string;
    rocketChatAccessToken: string;
    rocketChatUserId: string;
    roles: string[];
}
