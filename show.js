/**
 * show.js (条件付きデコード版)
 */
function renderV2Code(code) {
    try {
        const base64 = code.replace("!mirodot_v2 ", "");
        const bin = Array.from(atob(base64)).map(c => c.charCodeAt(0));
        let p = 0;

        const setId = bin[p++];
        const paletteType = bin[p++]; // 16ならパレットあり、0なら標準参照
        
        let palette = [];
        if (paletteType === 16) {
            // カスタムパレットを読み込む
            for (let i = 0; i < 16; i++) {
                const r = bin[p++], g = bin[p++], b = bin[p++];
                palette.push(i === 0 ? 'transparent' : `rgb(${r},${g},${b})`);
            }
        } else {
            // 【重要】標準パレットを参照（show.html側のPALETTESを利用）
            const palKeys = Object.keys(PALETTES);
            const key = palKeys[setId] || "基本";
            palette = [...PALETTES[key]];
        }

        const type = bin[p++];
        let pixels = [];
        const body = bin.slice(p);

        if (type === 2) {
            for (let i = 0; i < body.length; i += 2) {
                const color = body[i], count = body[i + 1];
                for (let j = 0; j < count; j++) pixels.push(color);
            }
        }
        // ... 他のtype判定
        
        return { pixels, palette };
    } catch (e) {
        return null;
    }
}

/**
 * HTML要素を組み立てる共通パーツ（show.html内に書いてもOK）
 */
function buildArtElement(user, pixels, palette) {
    const container = document.createElement('div');
    container.className = 'art-container';
    const grid = document.createElement('div');
    grid.className = 'pixel-grid jump';

    pixels.forEach(colorIdx => {
        const px = document.createElement('div');
        px.className = 'px';
        px.style.backgroundColor = palette[colorIdx] || 'transparent';
        grid.appendChild(px);
    });

    const nameTag = document.createElement('div');
    nameTag.className = 'user-name';
    nameTag.innerText = user;

    container.appendChild(grid);
    container.appendChild(nameTag);
    document.getElementById('stage').appendChild(container);

    const artObj = {
        el: container,
        grid: grid,
        user: user.toLowerCase(),
        left: -(ART_WIDTH + MARGIN),
        bottom: currentY,
        isFirstLoop: true
    };

    const userId = user.toLowerCase();
    if (!userContainers[userId]) userContainers[userId] = [];
    userContainers[userId].push(artObj);
    
    return artObj;
}