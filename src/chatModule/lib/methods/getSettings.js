import { InteractionManager } from "react-native";

import { store as reduxStore } from "../../../src";
// import { get } from './helpers/rest';
import database from "../../../main/ran-db/sqlite";
import * as actions from "../../actions";
import log from "../../utils/log";
import { settingsUpdatedAt } from "../../constants/settings";

const getLastUpdate = async () => {
  const [setting] = await database.objects(
    "settings",
    `ORDER BY _updatedAt ASC`
  );
  return setting && setting._updatedAt;
};

function updateServer(param) {
  database.create(
    "servers",
    { id: this.ddp.url, ...param },
    true,
    database.serversDB
  );
}

export default async function() {
  try {
    if (!this.ddp) {
      // TODO: should implement loop or get from rest?
      return;
    }

    const lastUpdate = await getLastUpdate();
    const fetchNewSettings = true; //lastUpdate < settingsUpdatedAt;
    const result = await (!lastUpdate || fetchNewSettings
      ? this.ddp.call("public-settings/get")
      : this.ddp.call("public-settings/get", new Date(lastUpdate)));
    const data = result.update || result || [];

    const filteredSettings = this._prepareSettings(this._filterSettings(data));

    InteractionManager.runAfterInteractions(() =>
      filteredSettings.forEach(setting => {
        database.create(
          "settings",
          { ...setting, _updatedAt: new Date() },
          true
        );

        if (setting._id === "Site_Name") {
          updateServer.call(this, { name: setting.valueAsString });
        }
      })
    );
    reduxStore.dispatch(
      actions.addSettings(this.parseSettings(filteredSettings))
    );

    const iconSetting = data.find(item => item._id === "Assets_favicon_512");
    if (iconSetting) {
      const iconURL = `${this.ddp.url}/${iconSetting.value.url ||
        iconSetting.value.defaultUrl}`;
      updateServer.call(this, { iconURL });
    }
  } catch (e) {
    log("getSettings", e);
  }
}
