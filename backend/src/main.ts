import "reflect-metadata";
import app from "./express";
import {Database} from "./database";
import {isMounted, tryMount, unmount} from "./mount";
import {MOUNT_PATH} from "./constants";

const PORT = 8000;

const db = new Database();

// (try to) mount all mount points from the database
(async () => {
    const mounts = await db.getMounts();
    for (const mount of mounts) {
        if (await isMounted(mount.url)) {
            continue;
        }
        try {
            await tryMount(mount.url, mount.mountPoint)
            mount.failed = false;
        } catch (e) {
            console.log("Failed to mount "+mount.url);
            mount.failed = true;
        }
    }
    await db.updateMounts(mounts);
})()

app.post('/mounts', async (req, res) =>{
    const url : string = req.body.url;
    const folder : string = MOUNT_PATH + '/' + req.body.path;

    // Try to mount
    try {
        const parsedUrl = await tryMount(url, folder);

        try {
            // Save in the database
            await db.addMount(parsedUrl, folder);
            return res.status(204).send();
        } catch (e) {
            // On a database error, revert the mount
            await unmount(folder);
            return res.status(500).send(e.message);
        }
    } catch (e) {
        return res.status(500).send(e.message);
    }
})

app.get('/mounts', async (req, res) => {
    const mounts = await db.getMounts();
    return res.status(200).send(mounts)
})

app.delete('/mounts', async (req, res) => {
    const id : number = req.body.id;
    // Get mount information from the database
    const mount = await db.getMount(id);
    if (mount === undefined)
        return res.status(400).send("That mount does not exist");

    // Try to unmount
    try {
        await unmount(mount.mountPoint);
        // Remove from the database
        await db.removeMount(id);
        return res.status(204).send();
    } catch (e) {
        return res.status(500).send(e.message);
    }
})

app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`)
})