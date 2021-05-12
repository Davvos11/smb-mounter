import "reflect-metadata";
import app from "./express";
import {Database} from "./database";
import path from "path";
import {parseUrl} from "./urlParser";

const PORT = 8000;

const db = new Database();

app.post('/mounts', (req, res) =>{
    let url : string = req.body.url;
    const folder = path.parse(req.body.path as string);

    url = parseUrl(url);

    console.log(url)

    res.status(200).send();
})

app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`)
})