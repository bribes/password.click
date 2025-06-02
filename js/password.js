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

async function generatePassword(options) {
    // Merge default options with user-provided ones
    const o = Object.assign({}, DefaultOptions, options);

    if (!o.special) o.minSpecial = 0;

    // Sanitize password length
    sanitizePasswordLength(o, true);

    const minLength = o.minUppercase + o.minLowercase + o.minNumber + o.minSpecial;
    if (o.length < minLength) {
        o.length = minLength;
    }

    const positions = [];
    populateCharacterPositions(o, positions);

    // Shuffle positions
    await shuffleArray(positions);

    // Define character sets
    const { lowercaseCharSet, uppercaseCharSet, numberCharSet, specialCharSet, allCharSet } = buildCharacterSets(o);

    return generatePasswordFromPositions(o, positions, { lowercaseCharSet, uppercaseCharSet, numberCharSet, specialCharSet, allCharSet });
}

// Populate positions for different character types
function populateCharacterPositions(options, positions) {
    for (let i = 0; i < options.minLowercase; i++) positions.push("l");
    for (let i = 0; i < options.minUppercase; i++) positions.push("u");
    for (let i = 0; i < options.minNumber; i++) positions.push("n");
    for (let i = 0; i < options.minSpecial; i++) positions.push("s");
    while (positions.length < options.length) positions.push("a");
}

// Build character sets based on options
function buildCharacterSets(options) {
    let lowercaseCharSet = "abcdefghijkmnopqrstuvwxyz" + (options.ambiguous ? "l" : "");
    let uppercaseCharSet = "ABCDEFGHJKLMNPQRSTUVWXYZ" + (options.ambiguous ? "IO" : "");
    let numberCharSet = "23456789" + (options.ambiguous ? "01" : "");
    let specialCharSet = "!@#$%^&*";

    let allCharSet = "";
    if (options.lowercase) allCharSet += lowercaseCharSet;
    if (options.uppercase) allCharSet += uppercaseCharSet;
    if (options.number) allCharSet += numberCharSet;
    if (options.special) allCharSet += specialCharSet;

    return { lowercaseCharSet, uppercaseCharSet, numberCharSet, specialCharSet, allCharSet };
}

// Generate password based on shuffled positions
async function generatePasswordFromPositions(options, positions, charSets) {
    let password = "";
    for (let i = 0; i < options.length; i++) {
        let positionChars;
        switch (positions[i]) {
            case "l": positionChars = charSets.lowercaseCharSet; break;
            case "u": positionChars = charSets.uppercaseCharSet; break;
            case "n": positionChars = charSets.numberCharSet; break;
            case "s": positionChars = charSets.specialCharSet; break;
            case "a": positionChars = charSets.allCharSet; break;
        }

        const randomCharIndex = await randomNumber(0, positionChars.length - 1);
        password += positionChars.charAt(randomCharIndex);
    }
    return password;
}

function sanitizePasswordLength(options, forGeneration) {
    let minUppercaseCalc = options.uppercase && options.minUppercase <= 0 ? 1 : options.minUppercase;
    let minLowercaseCalc = options.lowercase && options.minLowercase <= 0 ? 1 : options.minLowercase;
    let minNumberCalc = options.number && options.minNumber <= 0 ? 1 : options.minNumber;
    let minSpecialCalc = options.special && options.minSpecial <= 0 ? 1 : options.minSpecial;

    options.length = Math.max(options.length, minUppercaseCalc + minLowercaseCalc + minNumberCalc + minSpecialCalc);

    if (forGeneration) {
        Object.assign(options, { minUppercase: minUppercaseCalc, minLowercase: minLowercaseCalc, minNumber: minNumberCalc, minSpecial: minSpecialCalc });
    }
}

async function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = await randomNumber(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function changeFilled() {
    const val = +lengthinp.value;
    const min = +lengthinp.min;
    const max = +lengthinp.max;

    const percent = (val - min) / (max - min);

    const sliderWidth = lengthinp.offsetWidth;
    const thumbWidth = 16;
    const labelWidth = rangeLabel.offsetWidth;

    const trackWidth = sliderWidth - thumbWidth;

    const thumbCenterX = percent * trackWidth + thumbWidth / 2;

    const clampedLeft = Math.min(
        Math.max(thumbCenterX, labelWidth / 2),
        sliderWidth - labelWidth / 2
    );

    rangeLabel.style.left = `${clampedLeft - labelWidth / 2}px`;

    rangeLabel.textContent = val;

    const fillPercent = (thumbCenterX / sliderWidth) * 100;
    lengthinp.style.setProperty("--percent", `${fillPercent}%`);

    length = lengthinp.value;
}

function resizeInput() {
    let span = document.getElementById("hidden-span");

    span.textContent = secret.value || " ";
    secret.style.width = (span.offsetWidth + 32) + "px";
}

lengthinp.addEventListener('input', changeFilled);
secret.addEventListener('input', resizeInput);

async function regeneratePass() {
    password = await generatePassword({
        length,
        special: specialChars
    });
    secret.value = password;
    changeFilled()
    resizeInput()
}

window.addEventListener('load', regeneratePass);

window.setSpecial = (addChars) => {
    specialChars = addChars;
    if (addChars) {
        document.querySelector('#yes').classList.add('toggled');
        document.querySelector('#no').classList.remove('toggled');
    } else {
        document.querySelector('#yes').classList.remove('toggled');
        document.querySelector('#no').classList.add('toggled');
    }
}
window.setSpecial(specialChars)

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

document.getElementById('secret').addEventListener('click', () => copyTextToClipboard(password))

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