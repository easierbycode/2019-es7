"use strict";

// Stub the gstatic Firebase CDN so editor specs run hermetically (no
// network). initFirebase() is only invoked on demand (?level= or cloud-save
// clicks), which the specs avoid, so empty scripts are safe.
async function blockCdn(page) {
    await page.route("https://www.gstatic.com/**", (route) =>
        route.fulfill({ contentType: "application/javascript", body: "" })
    );
}

// Collect uncaught page errors; assert the array is empty at spec end.
function collectPageErrors(page) {
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    return errors;
}

module.exports = { blockCdn, collectPageErrors };
