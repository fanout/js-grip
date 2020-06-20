import IGripConfig from "./IGripConfig";
import IPublisherConfig from "./IPublisherConfig";

export function isGripConfig(obj: any): obj is IGripConfig {
    return obj?.control_uri != null;
}

export function isPublisherConfig(obj: any): obj is IPublisherConfig {
    return obj?.uri != null;
}

export function gripConfigToPublisherConfig(entry: IGripConfig): IPublisherConfig {
    const { control_uri: uri, control_iss: iss, key, } = entry;
    return {
        uri, iss, key,
    };
}