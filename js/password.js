const secret = document.getElementById('secret');
const lengthinp = document.getElementById('lengthinp');
const rangeLabel = document.getElementById("rangeLabel");

let length = 14;
let specialChars = false;
let password = "";

lengthinp.value = length;

/* CREDIT TO BITWARDEN */
const DefaultOptions = {
    length,
    ambiguous: false,
    number: true,
    minNumber: 1,
    uppercase: true,
    minUppercase: 0,
    lowercase: true,
    minLowercase: 0,
    special: specialChars,
    minSpecial: 1,
    numWords: 3,
    wordSeparator: "-",
    capitalize: false,
    includeNumber: false,
};

function generatePassword(options) {
    const o = { ...DefaultOptions, ...options };

    if (!o.special) o.minSpecial = 0;
    sanitizePasswordLength(o);

    const positions = shuffleArray(generatePositions(o));
    const charSets = buildCharacterSets(o);

    return positions.map(pos => randomChar(charSets[pos] || charSets.all)).join('');
}

function generatePositions(options) {
    return [
        ...Array(options.minLowercase).fill("lowercase"),
        ...Array(options.minUppercase).fill("uppercase"),
        ...Array(options.minNumber).fill("numbers"),
        ...Array(options.minSpecial).fill("special"),
        ...Array(Math.max(0, options.length - (
            options.minLowercase +
            options.minUppercase +
            options.minNumber +
            options.minSpecial
        ))).fill("all")
    ];
}

function buildCharacterSets({ lowercase, uppercase, number, special, ambiguous }) {
    return {
        lowercase: "abcdefghijkmnopqrstuvwxyz" + (ambiguous ? "l" : ""),
        uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ" + (ambiguous ? "IO" : ""),
        numbers: "23456789" + (ambiguous ? "01" : ""),
        special: "!@#$%^&*",
        all: (lowercase ? "abcdefghijkmnopqrstuvwxyz" : "") +
             (uppercase ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "") +
             (number ? "23456789" : "") +
             (special ? "!@#$%^&*" : "")
    };
}

const randomChar = set => set[Math.floor(Math.random() * set.length)];

function sanitizePasswordLength(options) {
    options.length = Math.max(
        options.length,
        options.uppercase ? Math.max(1, options.minUppercase) : 0,
        options.lowercase ? Math.max(1, options.minLowercase) : 0,
        options.number ? Math.max(1, options.minNumber) : 0,
        options.special ? Math.max(1, options.minSpecial) : 0
    );
}

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function updateRangeDisplay() {
    const val = +lengthinp.value;
    const percent = (val - lengthinp.min) / (lengthinp.max - lengthinp.min);
    const sliderWidth = lengthinp.offsetWidth;
    const trackWidth = sliderWidth - 16;
    const thumbCenterX = percent * trackWidth + 8;

    rangeLabel.textContent = val;
    rangeLabel.style.left = `${Math.max(Math.min(thumbCenterX, sliderWidth - rangeLabel.offsetWidth / 2), rangeLabel.offsetWidth / 2) - rangeLabel.offsetWidth / 2}px`;

    lengthinp.style.setProperty("--percent", `${(thumbCenterX / sliderWidth) * 100}%`);

    length = val;
    regeneratePass();
}

function resizeInput() {
    const span = document.getElementById("hidden-span");
    span.textContent = secret.value || " ";
    secret.style.width = `${span.offsetWidth + 32}px`;
}

lengthinp.addEventListener('input', updateRangeDisplay);
secret.addEventListener('input', resizeInput);

window.regeneratePass = () => {
    password = generatePassword({ length, special: specialChars });
    secret.value = password;
    resizeInput();
}

window.addEventListener('load', () => {
    regeneratePass();
    updateRangeDisplay();
});

window.setSpecial = (addChars) => {
    specialChars = addChars;
    document.querySelector('#yes').classList.toggle('toggled', addChars);
    document.querySelector('#no').classList.toggle('toggled', !addChars);
    regeneratePass();
};

window.setSpecial(specialChars);

async function copyTextToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Copied!');
    } catch {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    Object.assign(textArea.style, { top: "0", left: "0", position: "fixed" });

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        console.log('Fallback: Copying text command was successful');
    } catch (err) {
        console.error('Fallback: Unable to copy', err);
    }

    document.body.removeChild(textArea);
}

document.getElementById('secret').addEventListener('click', () => copyTextToClipboard(password));

tippy('#secret', {
    content: "Copied!",
    trigger: 'click',
    animation: 'shift-away',
    hideOnClick: false,
    theme: 'translucent',
    offset: [0, -12.5],
    onShow(instance) {
        setTimeout(() => instance.hide(), 500);
    }
});