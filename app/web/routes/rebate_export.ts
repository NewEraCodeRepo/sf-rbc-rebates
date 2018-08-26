import {app, viewContext} from "./support";
import {RebateExport} from "../../exports/rebates/rebate_export";
import {ExportDetailsRepository} from "../../database/repositories/export_details_repository";
import {RebateRepository} from "../../database/repositories/rebate_repository";
import {RebateExportSerializer} from "../../database/serializers/rebate_export_serializer";
import {LogStream} from "../log_stream";
import {CSVGenerator} from "../../exports/csv_generator";
import timestampForFile from "../util/timestamp_for_file";
import { tmpdir } from "os";

app.get("/rebate_export", async (request, response) => {
    const rebateExportDetails = await ExportDetailsRepository.findAll({
        order: { inserted_at: 'DESC' }
    });

    response.render("rebate_export/index", viewContext({
        rebateExportDetails,
        title: "Export History",
    }));
});

app.get("/rebate_export/new", async (request, response) => {
    const rebatesToExport = await RebateRepository.displayRebatesPendingExport();

    response.render("rebate_export/new", viewContext({ rebatesToExport, title: "Rebates to export" }));
});

app.get("/rebate_export/download", async (request, response) => {
    const fileName = `rmresults_preview_${timestampForFile()}.csv`;
    const filePath = `${tmpdir()}/${fileName}`;

    const rebatesToExport = await RebateRepository.displayRebatesPendingExport();
    const mappedRebates = rebatesToExport.map((rebate) => RebateExportSerializer.serialize(rebate));

    const csvGenerator = new CSVGenerator(mappedRebates, filePath);
    csvGenerator.perform();

    response.download(filePath);
});

app.post("/rebate_export/export", async (request, response) => {
    const logger = new LogStream(response);
    const exportOptions = {logger};

    await RebateExport.perform(exportOptions);
    response.end();

});

export default app;
