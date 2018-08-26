import {RebateSetEventSerde} from "datapipeline-schemas/events/rebateSetEvent";
import {buildRebateEventFn} from "../../events/event_builder";

export class RebateHandler {
    public static matches(name: string) {
        return name === "rebates";
    }

    public static getEventSerde(clientId: string) {
        return new RebateSetEventSerde(clientId);
    }

    public static getBuildRebateEventFn() {
        return buildRebateEventFn();
    }
}
