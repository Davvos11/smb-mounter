import {ChildProcess, execFile} from "child_process";
import {parseUrl} from "./urlParser";
import fs from "fs";
import path from "path";
import {MOUNT_PATH} from "./main";

/**
 * @throws ResolveError
 */
export async function tryMount(url: string, mountPath: string, attempt = 0){
    // Parse the url (can throw resolve error after some attempts)
    url = parseUrl(url, attempt);

    // Create a folder at the mount point
    await createMountPoint(mountPath);

    return new Promise<void>((resolve, reject) => {
        mount(url, mountPath).then(() => {
            resolve();
        }).catch(async (reason: string) => {
            // Remove the created folder
            await removeMountPoint(mountPath);
            // If it was a resolve error, try again
            if (reason.includes("could not resolve address")) {
                tryMount(url, mountPath, attempt + 1).then(resolve).catch(reject)
            } else {
                reject(reason)
            }
        })
    })
}

async function mount(url: string, mountPath: string) {
    const args = ["-t", "cifs", "-o", "username=anonymous,password=", url, mountPath]
    let child: ChildProcess;
    // Check if sudo is needed and try to mount
    if (isRoot()) {
        // Try to mount
        child = execFile("mount", args);
    } else {
        child = execFile("sudo", ["mount", ...args]);
    }

    // Route stdout and stderr
    child.stdout?.on('data', data => console.log(data));

    let stderr = "";
    child.stderr?.on('data', data => {
        stderr += data;
        console.error(data);
    })

    // Return a promise
    return new Promise<void>((resolve, reject) => {
        child.addListener("error", reject)
        child.addListener("exit", exitCode => {
            if (exitCode === 0)
                resolve()
            else
                reject(stderr)
        })
    })
}

function isRoot() {
    return process.getuid && process.getuid() === 0;
}

async function createMountPoint(location: string) {
    if (!fs.existsSync(location)) {
        console.log(`Creating ${location}`)
        return  fs.promises.mkdir(location, {recursive: true})
    }
}

async function removeMountPoint(location: string) {
    if (fs.existsSync(location)) {
        await removeEmptyDirectories(location)
    }
}

/**
 * Colonised from https://gist.github.com/fixpunkt/fe32afe14fbab99d9feb4e8da7268445
 * @param directory
 */
async function removeEmptyDirectories(directory: string) {
    // lstat does not follow symlinks (in contrast to stat)
    const fileStats = await fs.promises.lstat(directory);
    if (!fileStats.isDirectory()) {
        return;
    }
    const fileNames = await fs.promises.readdir(directory);

    if (fileNames.length === 0) {
        console.log('Removing: ', directory);
        await fs.promises.rmdir(directory);
    }

    // Go up a directory (if needed)
    const parent = path.dirname(directory)
    if (!path.relative(MOUNT_PATH, parent).includes('..') && parent !== MOUNT_PATH)
        await removeEmptyDirectories(path.dirname(directory))
}