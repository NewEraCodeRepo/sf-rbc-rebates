import * as moment from "moment";

const timestamp = "YYYY_MM_DD_hh_mm_ss";

export default function timestampForFile() {
    return moment().format(timestamp);
}
