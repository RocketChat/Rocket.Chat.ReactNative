import PubSub from "pubsub-js";

export const MY_TOPIC = Symbol("MY_TOPIC");

export const pubsubs = schema_name => {
  PubSub.publish(schema_name, "hello world!");
};
