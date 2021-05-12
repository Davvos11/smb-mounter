import {Column, Entity, PrimaryColumn} from "typeorm";
import {ParsedPath} from "path";

@Entity()
export class Mount {
    @Column()
    url!: URL;
    @PrimaryColumn()
    mountPoint!: ParsedPath;
}
