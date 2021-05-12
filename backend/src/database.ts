import {Connection, createConnection} from "typeorm";
import {Mount} from "./entity/Mount";
import {ParsedPath} from "path";

export class Database {
    private db: Connection | undefined;

    async getDb() {
        if (this.db === undefined) {
            this.db = await createConnection();
        }
        return this.db
    }

    async addMount(url: URL, mountPoint: ParsedPath) {
        const mount = new Mount();
        mount.url = url;
        mount.mountPoint = mountPoint;

        const mountRepository = (await this.getDb()).getRepository(Mount);

        await mountRepository.save(mount);
    }

    async getMounts() {
        const mountRepository = (await this.getDb()).getRepository(Mount);
        return mountRepository.find();
    }
}