import IGripConfig from "./IGripConfig";
import IPubControlConfig from "./IPubControlConfig";

export function isGripConfig(obj: any): obj is IGripConfig {
    return obj?.control_uri != null;
}

export function isPublisherConfig(obj: any): obj is IPubControlConfig {
    return obj?.uri != null;
}

export function gripConfigToPublisherConfig(entry: IGripConfig): IPubControlConfig {
    const { control_uri: uri, control_iss: iss, key, } = entry;
    return {
        uri, iss, key,
    };
}