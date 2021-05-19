export function parseUrl(url: string, attempt = 0) {
    // Remove "smb:" part at the start
    url = url.replace(/^smb:/, '');
    // If it seems to be a file instead of a dir, use the parent directory
    if (url.match(/\.\S{2,3}$/)) {
        url = url.replace(/\/[^\/]+$/, '');
    }

    if (attempt === 1) {
        // Add .student.utwente.nl so that it will route to campusnet
        url = url.replace(/\/\/([^\/]+)/, "//$1.student.utwente.nl");
    } else if (attempt >= 2) {
        throw new ResolveError();
    }

    return url;
}

export class ResolveError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "ResolveError";
    }
}