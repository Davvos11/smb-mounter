import "reflect-metadata";
import app from "./express";
import {Database} from "./database";
import {tryMount} from "./mount";
import {MOUNT_PATH} from "./constants";

const PORT = 8000;


const db = new Database();

app.post('/mounts', async (req, res) =>{
    const url : string = req.body.url;
    const folder : string = MOUNT_PATH + '/' + req.body.path;

    // Try to mount
    try {
        const parsedUrl = await tryMount(url, folder);
        // Save in the database
        await db.addMount(parsedUrl, folder);
        return res.status(204).send();
    } catch (e) {
        return res.status(500).send(e.message);
    }
})

app.get('/mounts', async (req, res) => {
    const mounts = await db.getMounts();
    return res.status(200).send(mounts)
})



app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`)
})