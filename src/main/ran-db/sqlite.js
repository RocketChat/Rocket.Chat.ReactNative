import { SQLite } from "expo";
import { isArray } from "lodash";
import moment from "moment";

import { pubsubs } from "./pubsubs";

const serversSchema =
  "create table if not exists servers (id TEXT primary key not null, name TEXT, iconURL TEXT);";
const serversKeys = ["id", "name", "iconURL"];
const serversPk = ["id"];

const settingsSchema =
  "create table if not exists settings (_id TEXT primary key not null, valueAsString TEXT, valueAsBoolean INTEGER, valueAsNumber TEXT, _updatedAt TEXT);";
const settingsKeys = [
  "_id",
  "valueAsString",
  "valueAsBoolean",
  "valueAsNumber",
  "_updatedAt"
];
const settingsPk = ["_id"];

const permissionsRolesSchema =
  "create table if not exists permissionsRoles (value TEXT primary key not null);";
const permissionsRolesKeys = ["value"];
const permissionsRolesPk = ["value"];

const permissionsSchema =
  "create table if not exists permissions (_id TEXT primary key not null, roles TEXT, _updatedAt TEXT);";
const permissionsKeys = ["_id", "roles", "_updatedAt"];
const permissionsPk = ["_id"];

const roomsSchema =
  "create table if not exists rooms (_id TEXT primary key not null, broadcast INTEGER);";
const roomsKeys = ["_id", "broadcast"];
const roomsPk = ["_id"];

const subscriptionRolesSchema =
  "create table if not exists subscriptionRolesSchema (value TEXT primary key not null);";
const subscriptionRolesKeys = ["value"];
const subscriptionRolesPk = ["value"];

const userMutedInRoomSchema =
  "create table if not exists usersMuted (value TEXT primary key not null);";
const userMutedInRoomKeys = ["value"];
const userMutedInRoomPk = ["value"];

//muted BLOB
const subscriptionSchema =
  "create table if not exists subscriptions (_id TEXT primary key not null, f INTEGER, t TEXT, ts TEXT, ls TEXT, name TEXT, fname TEXT, rid TEXT, open INTEGER, alert INTEGER, roles TEXT, unread INTEGER, userMentions INTEGER, roomUpdatedAt TEXT, ro INTEGER, lastOpen TEXT, lastMessage TEXT, description TEXT, announcement TEXT, topic TEXT, blocked INTEGER, blocker INTEGER, reactWhenReadOnly INTEGER, archived INTEGER, joinCodeRequired INTEGER, notifications INTEGER, muted TEXT, broadcast INTEGER);";
const subscriptionKeys = [
  "_id",
  "f",
  "t",
  "ts",
  "ls",
  "name",
  "fname",
  "rid",
  "open",
  "alert",
  "roles",
  "unread",
  "userMentions",
  "roomUpdatedAt",
  "ro",
  "lastOpen",
  "lastMessage",
  "description",
  "announcement",
  "topic",
  "blocked",
  "blocker",
  "reactWhenReadOnly",
  "archived",
  "joinCodeRequired",
  "notifications",
  "muted",
  "broadcast"
];
const subscriptionPk = ["_id"];

const usersSchema =
  "create table if not exists users (_id TEXT primary key not null, username TEXT, name TEXT,avatarVersion INTEGER);";
const usersKeys = ["_id", "username", "name", "avatarVersion"];
const usersPk = ["_id"];

const attachmentFields =
  "create table if not exists attachmentFields (title TEXT, value TEXT, short INTEGER);";
const attachmentFieldsKeys = ["title", "value", "short"];
const attachmentFieldsPk = ["title", "value", "short"];

//attachments BLOB, fields BLOB
const attachment =
  "create table if not exists attachment (description TEXT, image_size INTEGER, image_type TEXT, image_url TEXT, audio_size INTEGER, audio_type TEXT, audio_url TEXT, video_size INTEGER, video_type TEXT, video_url TEXT, title TEXT, title_link TEXT, type TEXT, author_icon TEXT, author_name TEXT, author_link TEXT, text TEXT, color TEXT, ts TEXT, attachments TEXT, fields TEXT);";
const attachmentKeys = [
  "description",
  "image_size",
  "image_type",
  "image_url",
  "audio_size",
  "audio_type",
  "audio_url",
  "video_size",
  "video_type",
  "video_url",
  "title",
  "title_link",
  "type",
  "author_icon",
  "author_name",
  "author_link",
  "text",
  "color",
  "ts",
  "attachments",
  "fields"
];
const attachmentPk = [
  "description",
  "image_size",
  "image_type",
  "image_url",
  "audio_size",
  "audio_type",
  "audio_url",
  "video_size",
  "video_type",
  "video_url",
  "title",
  "title_link",
  "type",
  "author_icon",
  "author_name",
  "author_link",
  "text",
  "color",
  "ts",
  "attachments",
  "fields"
];

const url =
  "create table if not exists url (url TEXT primary key not null, title TEXT, description TEXT,image TEXT);";
const urlKeys = ["url", "title", "description", "image"];
const urlPk = ["url"];

const messagesReactionsUsernamesSchema =
  "create table if not exists messagesReactionsUsernames (value TEXT primary key not null);";
const messagesReactionsUsernamesKeys = ["value"];
const messagesReactionsUsernamesPk = ["value"];

//usernames BLOB
const messagesReactionsSchema =
  "create table if not exists messagesReactions (emoji TEXT primary key not null, usernames TEXT);";
const messagesReactionsKeys = ["emoji", "usernames"];
const messagesReactionsPk = ["emoji"];

const messagesEditedBySchema =
  "create table if not exists messagesEditedBy (_id TEXT primary key not null, username TEXT);";
const messagesEditedByKeys = ["_id", "username"];
const messagesEditedByPk = ["_id"];

//u BLOB , attachments BLOB, urls BLOB,editedBy BLOB, reactions BLOB
const messagesSchema =
  "create table if not exists messages (_id TEXT primary key not null, msg TEXT, t TEXT, rid TEXT, ts TEXT, u TEXT, alias TEXT, parseUrls INTEGER, groupable INTEGER, avatar TEXT, attachments TEXT, urls TEXT, _updatedAt TEXT, status INTEGER, pinned INTEGER, starred INTEGER, editedBy TEXT, reactions TEXT, role TEXT);";
const messagesKeys = [
  "_id",
  "msg",
  "t",
  "rid",
  "ts",
  "u",
  "alias",
  "parseUrls",
  "groupable",
  "avatar",
  "attachments",
  "urls",
  "_updatedAt",
  "status",
  "pinned",
  "starred",
  "editedBy",
  "reactions",
  "role"
];
const messagesPk = ["_id"];

const frequentlyUsedEmojiSchema =
  "create table if not exists frequentlyUsedEmoji (content TEXT primary key, extension TEXT, isCustom INTEGER,count INTEGER);";
const frequentlyUsedEmojiKeys = ["content", "extension", "isCustom", "count"];
const frequentlyUsedEmojiPk = ["content"];

const customEmojiAliasesSchema =
  "create table if not exists customEmojiAliases (value TEXT primary key);";
const customEmojiAliasesKeys = ["value"];
const customEmojiAliasesPk = ["value"];

//aliases BLOB
const customEmojisSchema =
  "create table if not exists customEmojis (_id TEXT primary key, name TEXT, aliases TEXT, extension TEXT, _updatedAt TEXT);";
const customEmojisKeys = ["_id", "name", "aliases", "extension", "_updatedAt"];
const customEmojisPk = ["_id"];

const rolesSchema =
  "create table if not exists roles (_id TEXT primary key, description TEXT);";
const rolesKeys = ["_id", "description"];
const rolesPk = ["_id"];

const uploadsSchema =
  "create table if not exists uploads (path TEXT primary key, rid TEXT, name TEXT, description TEXT, size INTEGER, type TEXT, store TEXT, progress INTEGER, error INTEGER);";
const uploadsKeys = [
  "path",
  "rid",
  "name",
  "description",
  "size",
  "type",
  "store",
  "progress",
  "error"
];
const uploadsPk = ["path"];

const schemas = [
  // serversSchema,
  settingsSchema,
  subscriptionSchema,
  subscriptionRolesSchema,
  messagesSchema,
  usersSchema,
  roomsSchema,
  attachment,
  attachmentFields,
  messagesEditedBySchema,
  permissionsSchema,
  permissionsRolesSchema,
  url,
  frequentlyUsedEmojiSchema,
  customEmojiAliasesSchema,
  customEmojisSchema,
  messagesReactionsSchema,
  messagesReactionsUsernamesSchema,
  rolesSchema,
  userMutedInRoomSchema,
  uploadsSchema
];

const keys = {
  servers: serversKeys,
  settings: settingsKeys,
  permissionsRoles: permissionsRolesKeys,
  permissions: permissionsKeys,
  rooms: roomsKeys,
  subscriptionRolesSchema: subscriptionRolesKeys,
  usersMuted: userMutedInRoomKeys,
  subscriptions: subscriptionKeys,
  users: usersKeys,
  attachmentFields: attachmentFieldsKeys,
  attachment: attachmentKeys,
  url: urlKeys,
  messagesReactionsUsernames: messagesReactionsUsernamesKeys,
  messagesReactions: messagesReactionsKeys,
  messagesEditedBy: messagesEditedByKeys,
  messages: messagesKeys,
  frequentlyUsedEmoji: frequentlyUsedEmojiKeys,
  customEmojiAliases: customEmojiAliasesKeys,
  customEmojis: customEmojisKeys,
  roles: rolesKeys,
  uploads: uploadsKeys
};

const pks = {
  servers: serversPk,
  settings: settingsPk,
  permissionsRoles: permissionsRolesPk,
  permissions: permissionsPk,
  rooms: roomsPk,
  subscriptionRolesSchema: subscriptionRolesPk,
  usersMuted: userMutedInRoomPk,
  subscriptions: subscriptionPk,
  users: usersPk,
  attachmentFields: attachmentFieldsPk,
  attachment: attachmentPk,
  url: urlPk,
  messagesReactionsUsernames: messagesReactionsUsernamesPk,
  messagesReactions: messagesReactionsPk,
  messagesEditedBy: messagesEditedByPk,
  messages: messagesPk,
  frequentlyUsedEmoji: frequentlyUsedEmojiPk,
  customEmojiAliases: customEmojiAliasesPk,
  customEmojis: customEmojisPk,
  roles: rolesPk,
  uploads: uploadsPk
};

const tables = [
  "settings",
  "permissionsRoles",
  "permissions",
  "rooms",
  "subscriptionRolesSchema",
  "usersMuted",
  "subscriptions",
  "users",
  "attachmentFields",
  "attachment",
  "url",
  "messagesReactionsUsernames",
  "messagesReactions",
  "messagesEditedBy",
  "messages",
  "frequentlyUsedEmoji",
  "customEmojiAliases",
  "customEmojis",
  "roles",
  "uploads"
];

const isDateColumn = column => {
  return ["_updatedAt", "ts"].indexOf(column) > -1;
};

class DB {
  constructor() {
    this.database = null;
    this.serversDB = SQLite.openDatabase("default.chat");

    this.serversDB.transaction(tx => {
      // console.log(`schema is : ${schema}`);
      tx.executeSql(serversSchema);
    });
    // this.initDB("localhost:3000.chat"); //("default.chat");
  }

  initDB = database => {
    this.database = SQLite.openDatabase(database);

    schemas.map(schema =>
      this.database.transaction(
        tx => {
          // console.log(`schema is : ${schema}`);
          tx.executeSql(schema);
        },
        null,
        pubsubs("change")
      )
    );

    return this.database;
  };
  // get database() {
  //   return this.database.activeDB;
  // }
  objectstest = () => {
    console.log("objectstest");
    // WHERE rid="9RfXcpDkbFvbqf3nhNPq7a9ZFS7qWdcTdY"
    this.database.transaction(
      tx => {
        tx.executeSql(
          // "SELECT * FROM roles",
          `SELECT * FROM subscriptions WHERE (archived = 0 OR archived is null) and open = 1 ;`,
          [],
          (_, { rows }) => console.log("objectstest" + JSON.stringify(rows))
        );
      },
      null,
      () => {
        console.log("objectstest done");
      }
    );
  };

  objects = (table, requirement, db = this.database) => {
    let sql = requirement
      ? `SELECT * FROM ${table} ${requirement}`
      : `SELECT * FROM ${table}`;
    console.log("objects sql:" + sql);

    var p = new Promise((resolve, reject) => {
      try {
        // let result = await fetchDoubanApi();
        // console.log(result);
        db.transaction(tx => {
          tx.executeSql(sql, [], (_, { rows }) => {
            console.log("sql: " + sql + " rows:  " + JSON.stringify(rows));
            resolve(rows._array);
          });
        });
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
    return p;
  };

  // else if (schema_object[key] === true) {
  //   values.push(1);
  // } else if (schema_object[key] === false) {
  //   values.push(0);
  // }
  create(schema_name, schema_object, update, db = this.database) {
    if (update) {
      let sql = `INSERT OR IGNORE INTO ${schema_name} (`;
      let validKeys = [];
      let values = [];
      for (key in schema_object) {
        if (
          keys[schema_name].indexOf(key) > -1 &&
          typeof schema_object[key] !== "undefined" &&
          schema_object[key] !== null
        ) {
          validKeys.push(key);
          sql = sql + key + ", ";
          // values.push(schema_object[key]);
          if (schema_object[key] instanceof Date) {
            values.push(
              moment(schema_object[key]).format("YYYY-MM-DDTHH:mm:ss.SSS")
            );
          } else if (typeof schema_object[key] === "object") {
            values.push(JSON.stringify(schema_object[key]).toString());
          } else {
            values.push(schema_object[key]);
          }
        }
      }
      sql = sql.slice(0, sql.length - 2);
      sql = sql + ") VALUES (";

      values.forEach(elem => {
        sql = sql + "?, ";
      });

      sql = sql.slice(0, sql.length - 2);
      sql = sql + ");";

      console.log("create sql:" + sql);
      console.log("create sql values:" + values);

      let updateSql = `UPDATE ${schema_name} SET `;
      for (let i in validKeys) {
        // updateSql = updateSql + validKeys[i] + "='" + values[i] + "' ,";
        updateSql = updateSql + validKeys[i] + "=? ,";
      }
      updateSql = updateSql.slice(0, updateSql.length - 1);
      updateSql = updateSql + " WHERE ";
      let thisPks = pks[schema_name];
      for (let i in thisPks) {
        updateSql =
          updateSql +
          thisPks[i] +
          "='" +
          values[validKeys.indexOf(thisPks[i])] +
          "' ,";
      }
      updateSql = updateSql.slice(0, updateSql.length - 1);
      updateSql = updateSql + ";";

      console.log("update sql:" + updateSql);

      db.transaction(
        tx => {
          tx.executeSql(sql, values);
          tx.executeSql(updateSql, values);
        },
        null,
        pubsubs(schema_name)
      );
    } else {
      let sql = `REPLACE INTO ${schema_name} (`;
      let values = [];
      for (key in schema_object) {
        if (
          keys[schema_name].indexOf(key) > -1 &&
          typeof schema_object[key] !== "undefined" &&
          schema_object[key] !== null
        ) {
          sql = sql + key + ", ";
          // values.push(schema_object[key]);
          if (schema_object[key] instanceof Date) {
            values.push(schema_object[key].toString());
          } else if (typeof schema_object[key] === "object") {
            values.push(JSON.stringify(schema_object[key]).toString());
          } else {
            values.push(schema_object[key]);
          }
        }
      }
      sql = sql.slice(0, sql.length - 2);
      sql = sql + ") VALUES (";

      values.forEach(elem => {
        sql = sql + "?, ";
      });

      sql = sql.slice(0, sql.length - 2);
      sql = sql + ");";

      console.log("create sql:" + sql);
      console.log("create sql values:" + values);

      db.transaction(
        tx => {
          tx.executeSql(sql, values);
        },
        null,
        pubsubs(schema_name)
      );
    }
  }

  // create(schema_name, schema_object, update) {
  //   let sql = `REPLACE INTO ${schema_name} (`;
  //   let values = [];
  //   for (key in schema_object) {
  //     if (keys[schema_name].indexOf(key) > -1 && schema_object[key]) {
  //       sql = sql + key + ", ";
  //       // values.push(schema_object[key]);
  //       if (schema_object[key] instanceof Date) {
  //         values.push(schema_object[key].toString());
  //       } else if (typeof schema_object[key] === "object") {
  //         values.push(JSON.stringify(schema_object[key]).toString());
  //       } else {
  //         values.push(schema_object[key]);
  //       }
  //     }
  //   }
  //   sql = sql.slice(0, sql.length - 2);
  //   sql = sql + ") VALUES (";

  //   values.forEach(elem => {
  //     sql = sql + "?, ";
  //   });

  //   sql = sql.slice(0, sql.length - 2);
  //   sql = sql + ");";

  //   console.log("create sql:" + sql);
  //   console.log("create sql values:" + values);

  //   this.database.transaction(
  //     tx => {
  //       tx.executeSql(sql, values);
  //     },
  //     null,
  //     pubsubs(schema_name)
  //   );
  // }

  delete(schema_name, schema_object, db = this.database) {
    console.log("delete: " + schema_name);
    console.log(schema_object);

    if (isArray(schema_object)) {
      schema_object.map(item => {
        let key = keys[schema_name][0];
        let value = item[key];
        if (key) {
          db.transaction(
            tx => {
              tx.executeSql(
                `DELETE FROM ${schema_name} WHERE ${key} = "${value}"`
              );
            },
            null,
            pubsubs(schema_name)
            // pubsubs("delete")
          );
        }
      });
    } else {
      let key = keys[schema_name][0];
      let value = schema_object[key];
      if (key) {
        db.transaction(
          tx => {
            tx.executeSql(
              `DELETE FROM ${schema_name} WHERE ${key} = "${value}"`
            );
          },
          null,
          pubsubs(schema_name)
          // pubsubs("delete")
        );
      }
    }
  }

  deleteAll() {
    tables.map(schema =>
      this.database.transaction(tx => {
        // console.log(`schema is : ${schema}`);
        tx.executeSql(`DROP TABLE ${schema}`);
      })
    );
  }

  setActiveDB(db = "") {
    const path = db.replace(/(^\w+:|^)\/\//, "");
    if (this.database) {
      // this.database._db._closed = true;
    }

    return this.initDB(`${path}.chat`);
  }
}
export default new DB();

// const database = SQLite.openDatabase("default.chat");

// schemas.map(schema =>
//   database.transaction(tx => {
//     tx.executeSql(schema);
//   })
// );

// const objects = async (table, requirement) => {
//   let sql = requirement
//     ? `SELECT * FROM ${table} WHERE ${requirement}`
//     : `SELECT * FROM ${table}`;
//   console.log("sql:" + sql);

//   try {
//     // let result = await fetchDoubanApi();
//     // console.log(result);
//     await database.transaction(tx => {
//       tx.executeSql(sql, [], (_, { rows }) => {
//         console.log(sql + "   " + JSON.stringify(rows));
//         return rows;
//       });
//     });
//   } catch (e) {
//     console.log(e);
//   }
// };

// const create = (schema_name, schema_object, update) => {
//   let sql = `UPDATE ${schema_name} SET `;
//   for (key in schema_object) {
//     sql = sql + key + " = " + schema_object[key] + ",";
//   }
//   sql = sql.slice(0, sql.length - 1);
//   // const keys = Object.keys(schema_object);
//   // const values =  Object.values(schema_object);
//   console.log("sql:" + sql);
//   return database.transaction(tx => {
//     tx.executeSql(sql);
//   });
// };

// const setActiveDB = (db = "") => {
//   const path = db.replace(/(^\w+:|^)\/\//, "");
//   return (database.activeDB = SQLite.openDatabase(`${path}.chat`));
// };

// export { database, objects, create, setActiveDB };
