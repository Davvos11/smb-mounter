import {ChildProcess, execFile} from "child_process";
import {parseUrl} from "./urlParser";
import fs from "fs";
import path from "path";
import {MOUNT_PATH} from "./constants";

/**
 * @throws ResolveError
 */
export async function tryMount(url: string, mountPath: string, attempt = 0){
    // Parse the url (can throw resolve error after some attempts)
    url = parseUrl(url, attempt);

    // Create a folder at the mount point
    await createMountPoint(mountPath);

    return new Promise<string>((resolve, reject) => {
        mount(url, mountPath).then(() => {
            resolve(url);
        }).catch(async (reason: string) => {
            // Remove the created folder
            await removeMountPoint(mountPath);
            // If it was a resolve error, try again
            if (reason.includes("could not resolve address")) {
                tryMount(url, mountPath, attempt + 1).then(resolve).catch(reject)
            } else {
                reject(new MountError(reason))
            }
        })
    })
}

async function mount(url: string, mountPath: string) {
    const args = ["-t", "cifs", "-o", "username=anonymous,password=", url, mountPath]
    return execute("mount", args, true);
}

export async function unmount(mountPath: string) {
    // Try to unmount
    const promise = execute("umount", [mountPath], true);
    await promise;
    // Remove the folder
    return Promise.all([promise, removeMountPoint(mountPath)]);
}

export async function isMounted(mountPath: string) {
    try {
        await execute("grep", ["-qs", mountPath+" ", "/proc/mounts"])
        return true;
    } catch (e) {
        return false;
    }
}

async function execute(file: string, args: string[], asRoot = false) {
    let child: ChildProcess;
    // Check if sudo is needed and try to mount
    if (!asRoot || isRoot()) {
        // Try to mount
        child = execFile(file, args);
    } else {
        child = execFile("sudo", [file, ...args]);
    }

    // Route stdout and stderr
    let stdout = "";
    child.stdout?.on('data', data => {
        stdout += data;
        console.log(data)
    });

    let stderr = "";
    child.stderr?.on('data', data => {
        stderr += data;
        console.error(data);
    })

    // Return a promise
    return new Promise<string>((resolve, reject) => {
        child.addListener("error", reject)
        child.addListener("exit", exitCode => {
            if (exitCode === 0)
                resolve(stdout)
            else
                reject(stderr)
        })
    })
}

function isRoot() {
    return process.getuid && process.getuid() === 0;
}

async function createMountPoint(location: string) {
    if (path.relative(MOUNT_PATH, location).includes('..')) {
        throw new PermissionError("Writing to this directory is not allowed")
    }
    if (!fs.existsSync(location)) {
        console.log(`Creating ${location}`)
        return  fs.promises.mkdir(location, {recursive: true})
    }
}

async function removeMountPoint(location: string) {
    if (path.relative(MOUNT_PATH, location).includes('..')) {
        throw new PermissionError("Writing to this directory is not allowed")
    }
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

export class PermissionError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "PermissionError";
    }
}

export class MountError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "MountError";
    }
}