import {Column, Entity, PrimaryColumn, PrimaryGeneratedColumn} from "typeorm";
import {ParsedPath} from "path";

@Entity()
export class Mount {
    @PrimaryGeneratedColumn()
    id!: number;
    @Column()
    url!: string;
    @Column({unique: true})
    mountPoint!: string;
}
