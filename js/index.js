const outputContainer = document.getElementById("outputContainer");
outputContainer.style.display = "none";

function replaceField(config, regex, newValues) {
    return config.replace(regex, (_, prefix) => `${prefix}${newValues.join(", ")}`);
}

async function fetchIPLists(urls) {
    const allIPs = [];
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const text = await response.text();
                const ips = text.split(/\r?\n/).filter(line => line.trim() !== "");
                allIPs.push(...ips);
            }
        } catch (error) {
            console.error(`Az IP lista nem lekérhető: ${url}`, error);
        }
    }
    return allIPs;
}

const replaceButton = document.getElementById("replaceButton");
const copyButton = document.getElementById("copyButton");
const buttonIcon = document.getElementById("buttonIcon");
const outputElement = document.getElementById("output");

replaceButton.addEventListener("click", async () => {
    const config = document.getElementById("configInput").value;

    if (!config.trim()) {
        alert("Nem adtál meg semmilyen WireGuard konfigurációt.");
        return;
    }

    replaceButton.disabled = true;
    buttonIcon.classList.add('animate-spin');
    outputElement.textContent = '';

    const allowedIPsUrls = [
        "https://fxtelekom.org/ips/intern.txt",
        "https://fxtelekom.org/ips/hunt.txt",
        "https://fxtelekom.org/ips/valve-cs2.txt",
        "https://fxtelekom.org/ips/websupportsk.txt",
        "https://fxtelekom.org/ips/gcore.txt",
        "https://fxtelekom.org/ips/fastly.txt",
        "https://fxtelekom.org/ips/cloudflare.txt",
        "https://fxtelekom.org/ips/github-ucontent.txt"
    ];
    const dnsIPsUrl = "https://fxtelekom.org/ips/dns.txt";

    try {
        const [allowedIPs, dnsIPs] = await Promise.all([
            fetchIPLists(allowedIPsUrls),
            fetchIPLists([dnsIPsUrl])
        ]);

        if (allowedIPs.length === 0) {
            throw new Error("Hiba az engedélyezett IP címek lekérésében");
        }

        if (dnsIPs.length === 0) {
            throw new Error("Hiba a DNS IP címek lekérésében");
        }

        let updatedConfig = config;
        updatedConfig = replaceField(updatedConfig, /(AllowedIPs\s*=\s*)(.*)/i, allowedIPs);
        updatedConfig = replaceField(updatedConfig, /(DNS\s*=\s*)(.*)/i, dnsIPs);

        outputContainer.style.display = "block";
        outputElement.textContent = updatedConfig;
    } catch (error) {
        alert(error.message);
    } finally {
        replaceButton.disabled = false;
        buttonIcon.classList.remove('animate-spin');
    }
});

copyButton.addEventListener('click', () => {
    const outputText = outputElement.textContent;
    if (outputText) {
        navigator.clipboard.writeText(outputText).then(() => {
            copyButton.innerHTML = `
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <p>Kimásolva</p>
            `;
            setTimeout(() => {
                copyButton.innerHTML = `
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                    </svg>
                    <p>Másolás</p>
                `;
            }, 1800);
        });
    }
});
