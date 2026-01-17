/**
 * paint.js (パレット変更検知・最適化版)
 */
(function() {
    // パレットが変更されたかどうかのフラグ
    let isPaletteModified = false;

    // --- 既存の関数をラップしてフラグを管理 ---

    // 色変更をキャッチ
    const originalUpdateColor = window.updateCurrentPaletteColor;
    window.updateCurrentPaletteColor = function(hex) {
        isPaletteModified = true; // 変更フラグを立てる
        if (originalUpdateColor) originalUpdateColor(hex);
    };

    // リセットボタンをキャッチ
    const originalResetPalette = window.resetCurrentPalette;
    window.resetCurrentPalette = function() {
        if (confirm(`パレット「${currentPalKey}」を初期の状態に戻しますか？`)) {
            isPaletteModified = false; // フラグを下ろす
            if (originalResetPalette) {
                // confirmが重複しないよう、元の関数内のconfirmを考慮して実行
                saveHistory();
                PALETTES[currentPalKey] = [...DEFAULT_PALETTES[currentPalKey]];
                refreshColors();
                savePalettesToLocal();
            }
        }
    };

    // --- コード生成ロジック ---
    window.generateCode = function() {
        const pixels = cells.map(c => parseInt(c.dataset.idx));
        const palKeys = Object.keys(PALETTES);
        const setId = palKeys.indexOf(currentPalKey);

        let binaryData = [setId];

        // 【条件分岐】変更フラグが立っている場合のみパレットデータを入れる
        if (isPaletteModified) {
            binaryData.push(16); // パレットあり（16色分）
            PALETTES[currentPalKey].forEach(c => {
                const hex = (c === 'transparent') ? "000000" : c.replace('#', '');
                binaryData.push(
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)
                );
            });
        } else {
            binaryData.push(0); // パレットデータなしフラグ
        }

        // ピクセルデータのRLE圧縮 (最大255連続)
        let rleBody = [];
        let count = 1;
        for (let i = 0; i < pixels.length; i++) {
            if (pixels[i] === pixels[i + 1] && count < 255) {
                count++;
            } else {
                rleBody.push(pixels[i], count);
                count = 1;
            }
        }

        binaryData.push(2); // 拡張RLEモード
        binaryData = binaryData.concat(rleBody);

        const base64Body = btoa(String.fromCharCode(...binaryData));
        const finalCode = "!mirodot_v2 " + base64Body;

        document.getElementById('output').value = finalCode;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(finalCode).then(() => {
                alert(isPaletteModified ? "カスタムパレット込みでコピーしました" : "標準パレット参照でコピーしました（短縮版）");
            });
        }
    };
})();