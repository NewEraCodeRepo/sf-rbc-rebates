import * as AdmZip from "adm-zip";

export class ZipGenerator {
    private sourceFilePath: string;
    private targetFilePath: string;

    constructor(sourceFilePath: string, targetFilePath: string) {
        this.sourceFilePath = sourceFilePath;
        this.targetFilePath = targetFilePath;
    }

    public async perform() {
        try {
            const zip = new AdmZip();

            zip.addLocalFile(this.sourceFilePath);
            zip.writeZip(this.targetFilePath);
        } catch (err) {
            throw new Error(`[RM] - Error generating Zip... ${err}`);
        }
    }
}
