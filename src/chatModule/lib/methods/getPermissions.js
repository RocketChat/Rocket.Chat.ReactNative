import { InteractionManager } from "react-native";

import database from "../../../main/ran-db/sqlite";
import log from "../../utils/log";
import defaultPermissions from "../../constants/permissions";

const getLastUpdate = async () => {
  const setting = await database.objects(
    "permissions",
    `order by _updatedAt ASC`
  )[0];
  return setting && setting._updatedAt;
};

export default async function() {
  try {
    if (!this.ddp) {
      // TODO: should implement loop or get from rest?
      return;
    }

    const lastUpdate = await getLastUpdate();
    const result = await (!lastUpdate
      ? this.ddp.call("permissions/get")
      : this.ddp.call("permissions/get", new Date(lastUpdate)));
    const permissions = (result.update || result).filter(permission =>
      defaultPermissions.includes(permission._id)
    );
    permissions.map(permission => {
      permission._updatedAt = new Date();
      permission.roles = permission.roles.map(role => ({ value: role }));
      return permission;
    });

    InteractionManager.runAfterInteractions(() =>
      permissions.forEach(permission =>
        database.create("permissions", permission, true)
      )
    );
  } catch (e) {
    log("getPermissions", e);
  }
}
