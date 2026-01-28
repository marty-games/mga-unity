/* Made by Martin_MMC */
(() => {
    "use strict";

    /* BLOCKED DOMAINS → REDIRECTS */
    const BLOCKED_DOMAINS = {
        "rocketgoal.io": "//dashmetry.github.io",
        "dc.gg": "//discord.gg/F8kc4FKjnw",
        "discord.com": "//discord.gg/F8kc4FKjnw",
        "discord.gg": "//discord.com/invite/F8kc4FKjnw"
    };

    /* URL CHECK HELPER */
    function checkRedirect(url) {
        try {
            const hostname = new URL(url, location.href).hostname;
            return BLOCKED_DOMAINS[hostname] || null;
        } catch {
            return null;
        }
    }

    /* IFRAME POPUP REDIRECT (NOT BLOCK) */
    const originalCreateElement = document.createElement;

    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);

        if (tagName.toLowerCase() === "iframe") {
            Object.defineProperty(element, "contentWindow", {
                get() {
                    return {
                        open(url, ...args) {
                            const redirect = checkRedirect(url);
                            return window.open(redirect || url, ...args);
                        }
                    };
                }
            });
        }

        return element;
    };

    /* window.open REDIRECT */
    const originalWindowOpen = window.open;

    window.open = function(url, ...args) {
        const redirect = checkRedirect(url);

        // still prevent weird object-bound calls
        if (this && this !== window) {
            console.warn("Blocked invalid window.open context");
            return originalWindowOpen.call(window, redirect || "about:blank", ...args);
        }

        return originalWindowOpen.call(window, redirect || url, ...args);
    };
    /* location.href SETTER */
    const locationProto = Object.getPrototypeOf(window.location);

    Object.defineProperty(locationProto, "href", {
        set(url) {
            const redirect = checkRedirect(url);
            window.location.assign(redirect || url);
        }
    });

    /* <a> CLICK INTERCEPTION */
    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");
        if (!link) return;

        const redirect = checkRedirect(link.href);
        if (!redirect) return;

        event.preventDefault();
        window.location.assign(redirect);
    });

    /* META REFRESH REDIRECT */
    document
        .querySelectorAll('meta[http-equiv="refresh"]')
        .forEach((meta) => {
            const content = meta.getAttribute("content");
            const match = content?.match(/url=(.+)/i);
            if (!match) return;

            const redirect = checkRedirect(match[1]);
            if (redirect) {
                meta.setAttribute("content", `0; url=${redirect}`);
            }
        });

    /* window.navigate REDIRECT */
    if (window.navigate) {
        const originalNavigate = window.navigate;

        window.navigate = function(url) {
            const redirect = checkRedirect(url);
            return originalNavigate.call(window, redirect || url);
        };
    }
})();
