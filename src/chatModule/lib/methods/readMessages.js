import { post } from "./helpers/rest";
import database from "../../../main/ran-db/sqlite";
import log from "../../utils/log";
import { store } from "../../../src";

const readMessagesREST = function readMessagesREST(rid) {
  const { user } = store.getState().login;
  const { token, id } = user;
  const server = this.ddp.url.replace(/^ws/, "http");
  return post({ token, id, server }, "subscriptions.read", { rid });
};

const readMessagesDDP = function readMessagesDDP(rid) {
  try {
    return this.ddp.call("readMessages", rid);
  } catch (e) {
    return readMessagesREST.call(this, rid);
  }
};

export default async function readMessages(rid) {
  // const { database: db } = database;
  try {
    // eslint-disable-next-line
    const data = await (this.ddp && this.ddp.status
      ? readMessagesDDP.call(this, rid)
      : readMessagesREST.call(this, rid));
    const [subscription] = await database.objects(
      "subscriptions",
      `WHERE rid = "${rid}"`
    );
    subscription.open = true;
    subscription.alert = false;
    subscription.unread = 0;
    subscription.userMentions = 0;
    subscription.groupMentions = 0;
    subscription.ls = new Date();
    subscription.lastOpen = new Date();
    return data;
  } catch (e) {
    log("readMessages", e);
  }
}
