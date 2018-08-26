import * as fs from "fs";
import * as jsonexport from "jsonexport";

export class CSVGenerator {
    private fileContents: any[];
    private filePath: string;

    constructor(fileContents: any[], filePath: string) {
        this.fileContents = fileContents;
        this.filePath = filePath;
    }

    public perform() {
        jsonexport(this.fileContents, (err, csv) => {
            if (err) {
                throw new Error(`[RM] - Error generating CSV... ${err}`);
            } else {
                fs.writeFileSync(this.filePath, csv);
            }
        });
    }
}
