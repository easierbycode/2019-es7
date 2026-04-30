export function slugify(name) {
    return String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 30) || "level";
}

export function packageIdFor(name) {
    return "com.easierbycode." + slugify(name);
}
