import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { ApplicationRecord } from "./application_record";

@Entity('export_details')
export class ExportDetailsRecord extends ApplicationRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('timestamp with time zone')
    started_at: Date;

    @Column('timestamp with time zone', { nullable: true })
    finished_at: Date | null;

    @Column('text')
    status: string;

    @Column('integer')
    number_of_items: number;
}
