const defaults = require('defaults');
const definitions = require('./res/definitions');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');
let { Image } = require('canvas');

const AVATAR_WIDTH = 86;
const AVATAR_HEIGHT = 115;

const AVATAR_DEFAULTS = {
    angle: 1,
    head: 0, // possible values are 0, 3, 5, 6 and 7
    body: 1, // possible values are 1 and 4
    colours: { hair: 2, top: 8, legs: 14, skin: 0 },
    wielding: []
};

// various character colours that are defined in the client defined in 32-bit
// integers (rgb).
const SKIN_COLOURS = [ 0xecded0, 0xccb366, 0xb38c40, 0x997326, 0x906020 ];

const HAIR_COLOURS = [
    0xffc030, 0xffa040, 0x805030, 0x604020, 0x303030, 0xff6020,
    0xff4000, 0xffffff, 65280, 65535
];

const TOP_COLOURS = [
    0xff0000, 0xff8000, 0xffe000, 0xa0e000, 57344, 32768, 41088, 45311,
    33023, 12528, 0xe000e0, 0x303030, 0x604000, 0x805000, 0xffffff
];

// the orders of which part of the character stack in depending on the angle.
const SPRITE_ORDER = {
    FRONT: [
        'cape', 'legs', 'skirt', 'body', 'neck', 'head', 'med', 'chain',
        'left', 'right', 'boots'
    ],
    BACK: [
        'left', 'right', 'legs', 'skirt', 'body', 'neck', 'head', 'med',
        'chain', 'cape', 'boots'
    ],
    COMBAT: [
        'cape', 'legs', 'skirt', 'body', 'neck', 'head', 'med',
        'chain', 'boots', 'left', 'right' 
    ]
};

// which part of the character each position number corresponds to.
const WIELD_SLOTS = {
    11: 'cape', 4: 'right', 3: 'left', 6: 'chain', 0: 'head', 5: 'med',
    8: 'neck', 1: 'body', 7: 'skirt', 2: 'legs', 9: 'boots'
};

const SPRITE_PATH = path.resolve(__dirname, 'res', 'sprites', '%id.png');

if (typeof window !== 'undefined') {
    module.exports.spritePath = '/res/sprites/%id.png';
    Image = window.Image;
} else {
    module.exports.spritePath = SPRITE_PATH;
}

function fetchSprite(index) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onerror = err => reject(err);
        image.onload = () => resolve(image);
        image.src = module.exports.spritePath.replace('%id', index);
    });
};

// apply a colour filter to the sprite (for skin and/or armour colours).
function colourizeSprite(sprite, overlay, skin) {
    const canvas = createCanvas(sprite.width, sprite.height);
    const context = canvas.getContext('2d');

    if (overlay) {
        overlay = {
            r: (overlay >> 16) & 0xff,
            g: (overlay >> 8) & 0xff,
            b: overlay & 0xff
        };
    }

    if (skin) {
        skin = {
            r: (skin >> 16) & 0xff,
            g: (skin >> 8) & 0xff,
            b: skin & 0xff
        };
    }

    context.drawImage(sprite, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);

    for (i = 0; i < pixels.data.length; i += 4) {
        const r = pixels.data[i];
        const g = pixels.data[i + 1];
        const b = pixels.data[i + 2];

        if (skin) {
            if (r === 255 && g === b) {
                pixels.data[i] = (r * skin.r >> 8);
                pixels.data[i + 1] = (g * skin.g >> 8);
                pixels.data[i + 2] = (b * skin.b >> 8);
            }
        }

        if (overlay) {
            if (r === g && g === b && r === b) {
                pixels.data[i] = (r * overlay.r >> 8);
                pixels.data[i + 1] = (g * overlay.g >> 8);
                pixels.data[i + 2] = (b * overlay.b >> 8);
            }
        }
    }

    context.putImageData(pixels, 0, 0);

    return canvas;
}

async function fetchAnimation(animation, angle) {
    let sprite = await fetchSprite(animation.sprite + angle);

    if (animation.overlay > 5) {
        sprite = colourizeSprite(sprite, animation.overlay);
    }

    return sprite;
}

async function generatePlayer(player) {
    const canvas = createCanvas(AVATAR_WIDTH, AVATAR_HEIGHT);
    const context = canvas.getContext('2d');

    const character = {};
    const colours = {};

    defaults(player, AVATAR_DEFAULTS);

    for (const id of player.wielding) {
        const wield = definitions.wieldable[id];
        const animation = wield.animation;
        const name = WIELD_SLOTS[wield.position];

        character[name] = animation - 1;
    }

    // only add character sprites when there are no equibable items in those
    // slots.
    if (!character.head) {
        character.head = player.head;
        colours.head = HAIR_COLOURS[player.colours.hair];
    }

    if (!character.body) {
        character.body = player.body;
        colours.body = TOP_COLOURS[player.colours.top];
    }

    if (!character.legs) {
        character.legs = 2;
        colours.legs = TOP_COLOURS[player.colours.legs];
    }

    // apply and store the image buffers for each section of the character,
    // along with the offset to draw them at.
    for (const section of Object.keys(character)) {
        const animation = definitions.animations[character[section]];

        let image = await fetchAnimation(animation, player.angle);

        const colour = colours[section];

        if (colour) {
            image = colourizeSprite(image, colour,
                SKIN_COLOURS[player.colours.skin]);
        }

        // skin colour overlay for female platebodies.
        if (animation.sprite === 486) {
            image = colourizeSprite(image, null,
                SKIN_COLOURS[player.colours.skin]);
        }

        const shift = definitions.shifts[animation.sprite + player.angle];

        character[section] = {
            image: image,
            shift: shift
        };
    }

    let order;

    if (player.angle < 15) {
        order = player.angle >= 8 ? SPRITE_ORDER.BACK : SPRITE_ORDER.FRONT;
    } else {
        order = SPRITE_ORDER.COMBAT;
    }

    // draw the buffered, coloured sprites in the correct order given the
    // angle.
    for (const section of order) {
        const sprite = character[section];

        if (sprite) {
            context.drawImage(sprite.image, sprite.shift.x, sprite.shift.y);
        }
    }

    return canvas;
};

module.exports.player = generatePlayer;