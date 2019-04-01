import settings from "./reducers";
import login from "./login";
import meteor from "./connect";
import messages from "./messages";
import room from "./room";
import rooms from "./rooms";
import server from "./server";
import navigator from "./navigator";
import selectedUsers from "./selectedUsers";
import createChannel from "./createChannel";
import app from "./app";
import customEmojis from "./customEmojis";
import activeUsers from "./activeUsers";
import roles from "./roles";
import starredMessages from "./starredMessages";
import pinnedMessages from "./pinnedMessages";
import mentionedMessages from "./mentionedMessages";
import snippetedMessages from "./snippetedMessages";
import roomFiles from "./roomFiles";
import sortPreferences from "./sortPreferences";

export default {
  settings,
  login,
  meteor,
  messages,
  server,
  navigator,
  selectedUsers,
  createChannel,
  app,
  room,
  rooms,
  customEmojis,
  activeUsers,
  roles,
  starredMessages,
  pinnedMessages,
  mentionedMessages,
  snippetedMessages,
  roomFiles,
  sortPreferences
};
