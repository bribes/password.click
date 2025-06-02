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
    const o = Object.assign({}, DefaultOptions, options);

    if (!o.special) o.minSpecial = 0;
    sanitizePasswordLength(o);

    const positions = generatePositions(o);
    shuffleArray(positions);

    const charSets = buildCharacterSets(o);
    return generatePasswordFromPositions(o, positions, charSets);
}

function generatePositions(options) {
    const positions = [];
    positions.push(...Array(options.minLowercase).fill("l"));
    positions.push(...Array(options.minUppercase).fill("u"));
    positions.push(...Array(options.minNumber).fill("n"));
    positions.push(...Array(options.minSpecial).fill("s"));

    while (positions.length < options.length) positions.push("a");
    return positions;
}

function buildCharacterSets(options) {
    const lowercase = "abcdefghijkmnopqrstuvwxyz" + (options.ambiguous ? "l" : "");
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ" + (options.ambiguous ? "IO" : "");
    const numbers = "23456789" + (options.ambiguous ? "01" : "");
    const special = "!@#$%^&*";

    let all = "";
    if (options.lowercase) all += lowercase;
    if (options.uppercase) all += uppercase;
    if (options.number) all += numbers;
    if (options.special) all += special;

    return { lowercase, uppercase, numbers, special, all };
}

function generatePasswordFromPositions(options, positions, charSets) {
    return positions.map(pos => {
        switch (pos) {
            case "l": return randomChar(charSets.lowercase);
            case "u": return randomChar(charSets.uppercase);
            case "n": return randomChar(charSets.numbers);
            case "s": return randomChar(charSets.special);
            case "a": return randomChar(charSets.all);
        }
    }).join('');
}

function randomChar(set) {
    return set[Math.floor(Math.random() * set.length)];
}

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
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function changeFilled() {
    const val = +lengthinp.value;
    const min = +lengthinp.min;
    const max = +lengthinp.max;
    const percent = (val - min) / (max - min);
    const sliderWidth = lengthinp.offsetWidth;
    const trackWidth = sliderWidth - 16;
    const thumbCenterX = percent * trackWidth + 8;
    rangeLabel.textContent = val;
    length = val;
    const labelWidth = rangeLabel.offsetWidth;
    const clampedLeft = Math.min(Math.max(thumbCenterX, labelWidth / 2), sliderWidth - labelWidth / 2);
    rangeLabel.style.left = `${clampedLeft - labelWidth / 2}px`;
    lengthinp.style.setProperty("--percent", `${(thumbCenterX / sliderWidth) * 100}%`);
    regeneratePass();
}

function resizeInput() {
    const span = document.getElementById("hidden-span");
    span.textContent = secret.value || " ";
    secret.style.width = `${span.offsetWidth + 32}px`;
}

lengthinp.addEventListener('input', changeFilled);
secret.addEventListener('input', resizeInput);

function regeneratePass() {
    password = generatePassword({ length, special: specialChars });
    secret.value = password;
    resizeInput();
}

window.addEventListener('load', () => {
    regeneratePass();
    changeFilled();
});

window.setSpecial = (addChars) => {
    specialChars = addChars;
    document.querySelector('#yes').classList.toggle('toggled', addChars);
    document.querySelector('#no').classList.toggle('toggled', !addChars);
    regeneratePass();
};

window.setSpecial(specialChars);

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
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
        setTimeout(() => {
            instance.hide();
        }, 500);
    }
});