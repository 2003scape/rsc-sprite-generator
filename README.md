# rsc-sprite-generator
![](./doc/avatar-1.png?raw=true) ![](./doc/avatar-2.png?raw=true) 
![](./doc/avatar-3.png?raw=true) ![](./doc/avatar-4.png?raw=true) 
![](./doc/avatar-5.png?raw=true) 

generate entity sprites used for NPCs and players in runescape classic.

## install

    $ npm install rsc-sprite-generator

## usage (browser or server)

```javascript
const fs = require('fs').promises;
const spriteGenerator = require('rsc-sprite-generator');

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
```

## license
Copyright 2019  2003Scape Team

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the
Free Software Foundation, either version 3 of the License, or (at your option)
any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see http://www.gnu.org/licenses/.