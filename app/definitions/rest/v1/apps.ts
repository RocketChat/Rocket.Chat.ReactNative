import { IAppActionButton } from "definitions/IAppActionButton";

export type AppsEndpoints = {
    'actionButtons': {
        GET: () => IAppActionButton[];
    }
}