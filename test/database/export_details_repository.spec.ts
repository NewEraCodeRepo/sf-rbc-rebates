import exportDetails from '../fixtures/export_details';
import { ExportDetailsRepository } from "../../app/database/repositories/export_details_repository";
import { includeRepositoryTests } from "./shared_repository_tests";

xdescribe('ExportDetailsRepository', () => {
    includeRepositoryTests(ExportDetailsRepository, exportDetails);
});
