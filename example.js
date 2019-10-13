const fs = require('fs').promises;
const spriteGenerator = require('./');

const HEADS = [0, 3, 5, 6, 7];

(async () => {
    try {
        const avatar = await spriteGenerator.player({
            angle: Math.floor(Math.random() * (14 + 3)),
            head: HEADS[Math.floor(Math.random() * HEADS.length)],
            body: Math.random() >= 0.5 ? 4 : 1,
            colours: { 
                hair: Math.floor(Math.random() * 10),
                top: Math.floor(Math.random() * 15), 
                legs: Math.floor(Math.random() * 15), 
                skin: Math.floor(Math.random() * 4)
            },
            wielding: [81]
        });

        if (typeof window !== 'undefined') {
            document.body.appendChild(avatar);
        } else {
            await fs.writeFile('./avatar.png', avatar.toBuffer());
        }
    } catch (e) {
        console.error(e);
    }
})();
