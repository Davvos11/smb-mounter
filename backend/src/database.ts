import {Connection, createConnection} from "typeorm";
import {Mount} from "./entity/Mount";
import {ParsedPath} from "path";

export class Database {
    private db: Connection | undefined;

    private async getDb() {
        if (this.db === undefined) {
            this.db = await createConnection();
        }
        return this.db
    }

    private async getRepo() {
        return (await this.getDb()).getRepository(Mount);
    }

    async addMount(url: string, mountPoint: string) {
        const mount = new Mount();
        mount.url = url;
        mount.mountPoint = mountPoint;

        const mountRepository = await this.getRepo();

        await mountRepository.save(mount);
    }

    async getMounts() {
        const mountRepository = await this.getRepo();
        return mountRepository.find();
    }

    async getMount(id: number) {
        const mountRepository = await this.getRepo();
        return mountRepository.findOne(id)
    }

    async removeMount(id: number) {
        const mountRepository = await this.getRepo();
        const mount = await mountRepository.findOne(id)
        if (mount !== undefined)
            await mountRepository.remove(mount)
    }

    async updateMount(mount: Mount) {
        const mountRepository = await this.getRepo();
        await mountRepository.save(mount);
    }

    async updateMounts(mounts: Mount[]) {
        const mountRepository = await this.getRepo();
        await mountRepository.save(mounts);
    }
}