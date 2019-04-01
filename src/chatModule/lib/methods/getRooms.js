import { InteractionManager } from "react-native";

// import { showToast } from '../../utils/info';
import { get } from "./helpers/rest";
import mergeSubscriptionsRooms, {
  merge
} from "./helpers/mergeSubscriptionsRooms";
import database from "../../../main/ran-db/sqlite";
import log from "../../utils/log";
import { store } from "../../../src";

//"subscriptions", "ORDER BY roomUpdatedAt ASC"
const lastMessage = async function() {
  const message = await database.objects(
    "subscriptions",
    "ORDER BY roomUpdatedAt ASC"
  );
  return message[0] && new Date(message[0].roomUpdatedAt);
};

const getRoomRest = async function() {
  const updatedSince = await lastMessage();
  const { user } = store.getState().login;
  const { token, id } = user;
  const server = this.ddp.url.replace(/^ws/, "http");
  const [subscriptions, rooms] = await Promise.all([
    get({ token, id, server }, "subscriptions.get", { updatedSince }),
    get({ token, id, server }, "rooms.get", { updatedSince })
  ]);
  return mergeSubscriptionsRooms(subscriptions, rooms);
};

const getRoomDpp = async function() {
  try {
    const { ddp } = this;
    const updatedSince = await lastMessage();

    const [subscriptions, rooms] = await Promise.all([
      ddp.call("subscriptions/get", updatedSince),
      ddp.call("rooms/get", updatedSince)
    ]);
    return mergeSubscriptionsRooms(subscriptions, rooms);
  } catch (e) {
    return getRoomRest.apply(this);
  }
};

export default async function() {
  return new Promise(async (resolve, reject) => {
    try {
      // eslint-disable-next-line
      const { subscriptions, rooms } = await (this.ddp && this.ddp.status
        ? getRoomDpp.apply(this)
        : getRoomRest.apply(this));

      const data = rooms.map(room => ({
        room,
        sub: database.objects("subscriptions", `WHERE rid = ${room._id}`)
      }));

      InteractionManager.runAfterInteractions(() => {
        subscriptions.forEach(subscription =>
          database.create("subscriptions", subscription, true)
        );
        data.forEach(({ sub, room }) => sub[0] && merge(sub[0], room));
        resolve(data);
      });
    } catch (e) {
      log("getRooms", e);
      reject(e);
    }
  });
}
