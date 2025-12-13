let psychJSON = null;
let xmlData = {};
let imageList = [];

const fileInput = document.getElementById('file-input');
const fileName = document.getElementById('file-name');
const charName = document.getElementById('char-name');
const convertBtn = document.getElementById('convert-btn');
const resultSection = document.getElementById('result-section');
const resultTextarea = document.getElementById('result');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const copyMessage = document.getElementById('copy-message');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const multisparrowSection = document.getElementById('multisparrow-section');
const xmlUploads = document.getElementById('xml-uploads');
const useBaseOffsets = document.getElementById('use-base-offsets');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                psychJSON = JSON.parse(event.target.result);
                xmlData = {};
                setupMultisparrow();
                checkCanConvert();
                hideError();
            } catch (err) {
                showError('Error: El archivo no es un JSON valido');
                psychJSON = null;
                checkCanConvert();
            }
        };
        reader.readAsText(file);
    }
});

function setupMultisparrow() {
    if (!psychJSON || !psychJSON.image) {
        multisparrowSection.classList.add('hidden');
        imageList = [];
        return;
    }

    imageList = psychJSON.image.split(',').map(img => img.trim());

    if (imageList.length > 1) {
        multisparrowSection.classList.remove('hidden');
        xmlUploads.innerHTML = '';

        imageList.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'xml-upload-item';

            const label = document.createElement('label');
            label.textContent = `${img}.xml`;

            const inputId = `xml-input-${index}`;
            const input = document.createElement('input');
            input.type = 'file';
            input.id = inputId;
            input.accept = '.xml';
            input.dataset.image = img;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'xml-upload-btn';
            btn.textContent = 'Subir XML';
            btn.onclick = () => input.click();

            input.addEventListener('change', (e) => {
                const xmlFile = e.target.files[0];
                if (xmlFile) {
                    const xmlReader = new FileReader();
                    xmlReader.onload = (ev) => {
                        try {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(ev.target.result, 'text/xml');
                            const prefixes = extractPrefixesFromXML(xmlDoc);
                            xmlData[img] = prefixes;
                            btn.textContent = 'Cargado';
                            btn.classList.add('loaded');
                            checkCanConvert();
                        } catch (err) {
                            showError(`Error al leer ${xmlFile.name}`);
                        }
                    };
                    xmlReader.readAsText(xmlFile);
                }
            });

            div.appendChild(label);
            div.appendChild(input);
            div.appendChild(btn);
            xmlUploads.appendChild(div);
        });
    } else {
        multisparrowSection.classList.add('hidden');
    }
}

function extractPrefixesFromXML(xmlDoc) {
    const prefixes = new Set();
    const subtextures = xmlDoc.querySelectorAll('SubTexture');
    subtextures.forEach(sub => {
        const name = sub.getAttribute('name') || '';
        const prefix = name.replace(/\d{4}\.png$/, '').replace(/\d{4}$/, '');
        if (prefix) prefixes.add(prefix);
    });
    return Array.from(prefixes);
}

charName.addEventListener('input', checkCanConvert);

function checkCanConvert() {
    const hasName = charName.value.trim().length > 0;
    const hasJSON = psychJSON !== null;

    if (imageList.length > 1) {
        const allXMLsLoaded = imageList.every(img => xmlData[img] && xmlData[img].length > 0);
        convertBtn.disabled = !(hasJSON && hasName && allXMLsLoaded);
    } else {
        convertBtn.disabled = !(hasJSON && hasName);
    }
}

convertBtn.addEventListener('click', () => {
    if (!psychJSON || !charName.value.trim()) return;

    try {
        const useBase = useBaseOffsets.checked;
        const vsliceJSON = convertPsychToVSlice(psychJSON, charName.value.trim(), useBase);
        const jsonString = JSON.stringify(vsliceJSON, null, '\t');
        resultTextarea.value = jsonString;
        resultSection.classList.remove('hidden');
        hideError();
    } catch (err) {
        showError('Error durante la conversion: ' + err.message);
    }
});

function findImageForPrefix(animPrefix) {
    if (imageList.length <= 1) return null;

    for (const img of imageList) {
        const prefixes = xmlData[img] || [];
        if (prefixes.some(p => animPrefix.startsWith(p) || p.startsWith(animPrefix))) {
            return img;
        }
    }
    return imageList[0];
}

function convertPsychToVSlice(psych, characterName, useBaseOffsets) {
    const isMultisparrow = imageList.length > 1;
    const mainImage = imageList[0] || (psych.image ? psych.image.split(',')[0].trim() : 'character');

    const charPosition = psych.position || [0, 0];
    const charPosX = charPosition[0] || 0;
    const charPosY = charPosition[1] || 0;

    const vslice = {
        version: '1.0.1',
        name: characterName.trim(),
        renderType: isMultisparrow ? 'multisparrow' : 'sparrow',
        assetPath: mainImage,
        scale: psych.scale ?? 1.0,
        healthIcon: {
            id: (psych.healthicon ?? 'face').trim(),
            isPixel: psych.no_antialiasing ?? false
        },
        offsets: [0, 0],
        // --- MODIFICACIÓN: Fija el cameraOffsets a [0, 0] para evitar el "sabático" ---
        cameraOffsets: [0, 0], 
        // -------------------------------------------------------------------------------
        isPixel: psych.no_antialiasing ?? false,
        danceEvery: 2,
        singTime: psych.sing_duration ?? 8.0,
        startingAnimation: 'idle',
        animations: [],
        flipX: psych.flip_x ?? false
    };

    if (psych.animations && Array.isArray(psych.animations)) {
        for (const animation of psych.animations) {
            let anim = (animation.anim || '').trim();
            if (anim.endsWith('-loop')) {
                anim = anim.replace('-loop', '-hold');
            }

            const origOffsets = animation.offsets || [0, 0];
            const origX = origOffsets[0] || 0;
            const origY = origOffsets[1] || 0;

            let finalOffsets;
            if (useBaseOffsets) {
                // Si useBaseOffsets es true, normalizamos los offsets restando la posición base del personaje.
                finalOffsets = [
                    origX - charPosX,
                    origY - charPosY
                ];
            } else {
                // Si useBaseOffsets es false, usamos los offsets directos de Psych Engine.
                finalOffsets = [origX, origY];
            }

            const animObj = {
                name: anim,
                prefix: (animation.name || '').trim(),
                offsets: finalOffsets,
                looped: animation.loop ?? false,
                frameRate: animation.fps ?? 24,
                frameIndices: animation.indices ?? []
            };

            if (isMultisparrow) {
                const animImage = findImageForPrefix(animation.name || '');
                if (animImage && animImage !== mainImage) {
                    animObj.assetPath = animImage;
                }
            }

            vslice.animations.push(animObj);

            if (anim.startsWith('dance') && vslice.startingAnimation === 'idle') {
                vslice.startingAnimation = 'danceRight';
            }
        }
    }

    if (vslice.startingAnimation === 'danceRight') {
        vslice.danceEvery = 1;
    }

    return vslice;
}

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(resultTextarea.value);
        copyMessage.classList.remove('hidden');
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 2000);
    } catch (err) {
        resultTextarea.select();
        document.execCommand('copy');
        copyMessage.classList.remove('hidden');
        setTimeout(() => {
            copyMessage.classList.add('hidden');
        }, 2000);
    }
});

downloadBtn.addEventListener('click', () => {
    const blob = new Blob([resultTextarea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${charName.value.trim()} (converted).json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
}

function hideError() {
    errorSection.classList.add('hidden');
}
