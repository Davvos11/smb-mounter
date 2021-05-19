import "reflect-metadata";
import app from "./express";
import {Database} from "./database";
import path from "path";
import {parseUrl} from "./urlParser";
import {tryMount} from "./mount";

const PORT = 8000;
export const MOUNT_PATH = "/mnt/test";

const db = new Database();

app.post('/mounts', (req, res) =>{
    const url : string = req.body.url;
    const folder : string = req.body.path;

    tryMount(url, `${MOUNT_PATH}/${folder}`).then((result) => {
        return res.status(200).send();
    }).catch(reason => {
        return res.status(500).send(reason);
    })
})

app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`)
})