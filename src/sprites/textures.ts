// ---------------------------------------------------------------------------
// Market Rush — procedural texture factory (Phaser Graphics API).
// Every texture key used by the Game scene is generated here BEFORE create()
// finishes. Flat vibrant West-African palette: terracotta, naira-green,
// indigo adire, sun-yellow.
// ---------------------------------------------------------------------------
import type { Scene } from 'phaser';

const C = {
    terracotta: 0xc96f4a,
    terracottaDark: 0x9c4f31,
    wood: 0x8a5a33,
    woodDark: 0x6b4324,
    woodLight: 0xa9764a,
    adire: 0x2b3a67,
    adireLight: 0x46608f,
    sun: 0xf6c445,
    naira: 0x2e8b57,
    cream: 0xfff3dc,
    ink: 0x241a12,
    red: 0xd92b1c,
    tomato: 0xe8402a,
    onion: 0x8e3b8f,
    onionSkin: 0xc98bbf,
    cray: 0xb0632b,
    plantain: 0xf2c531,
    plantainDark: 0xc79a1e,
    palm: 0xc44a08,
};

function g(scene: Scene) { return scene.add.graphics(); }

// --- Goods icons (48x48) ---------------------------------------------------
export function createGoodsTextures(scene: Scene): void {
    // Ata Rodo — scotch bonnet: 3 lobed red pepper + green stem
    let gr = g(scene);
    gr.fillStyle(0x2f7d32, 1);
    gr.fillRect(20, 4, 8, 8);
    gr.fillCircle(24, 12, 5);
    gr.fillStyle(C.red, 1);
    gr.fillCircle(16, 26, 11);
    gr.fillCircle(32, 26, 11);
    gr.fillCircle(24, 34, 11);
    gr.fillStyle(0xffffff, 0.35);
    gr.fillCircle(18, 22, 4);
    gr.generateTexture('good_ata', 48, 48); gr.destroy();

    // Tomatoes — two plump red tomatoes with leaf star
    gr = g(scene);
    gr.fillStyle(C.tomato, 1);
    gr.fillCircle(18, 30, 13);
    gr.fillCircle(33, 26, 11);
    gr.fillStyle(0xffffff, 0.3);
    gr.fillCircle(14, 25, 4);
    gr.fillStyle(0x3a8a3a, 1);
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        gr.fillTriangle(18, 17, 18 + Math.cos(a) * 8, 17 + Math.sin(a) * 8, 18 + Math.cos(a + 0.6) * 3, 17 + Math.sin(a + 0.6) * 3);
    }
    gr.generateTexture('good_tomato', 48, 48); gr.destroy();

    // Alubosa — purple onion with dry neck
    gr = g(scene);
    gr.fillStyle(C.onion, 1);
    gr.fillEllipse(24, 28, 30, 34);
    gr.fillStyle(C.onionSkin, 0.5);
    gr.lineStyle(2, C.onionSkin, 0.8);
    gr.beginPath(); gr.moveTo(16, 14); gr.lineTo(14, 40); gr.strokePath();
    gr.beginPath(); gr.moveTo(24, 12); gr.lineTo(24, 42); gr.strokePath();
    gr.beginPath(); gr.moveTo(32, 14); gr.lineTo(34, 40); gr.strokePath();
    gr.fillStyle(0xd9c48a, 1);
    gr.fillRect(21, 4, 6, 10);
    gr.generateTexture('good_alubosa', 48, 48); gr.destroy();

    // Crayfish — small basket of smoked crayfish
    gr = g(scene);
    gr.fillStyle(C.cray, 1);
    for (let i = 0; i < 7; i++) {
        const x = 10 + (i % 4) * 9, y = 12 + Math.floor(i / 4) * 8;
        gr.fillEllipse(x, y, 10, 5);
        gr.fillRect(x + 4, y - 2, 4, 2);
    }
    gr.fillStyle(C.wood, 1);
    gr.fillRect(6, 24, 36, 4);
    gr.fillStyle(C.woodLight, 1);
    gr.fillRect(6, 28, 36, 12);
    gr.lineStyle(2, C.woodDark, 1);
    for (let i = 0; i < 4; i++) gr.lineBetween(6 + i * 12, 28, 6 + i * 12, 40);
    gr.lineBetween(6, 34, 42, 34);
    gr.generateTexture('good_crayfish', 48, 48); gr.destroy();

    // Plantain — curved yellow bunch with spots
    gr = g(scene);
    gr.fillStyle(C.plantain, 1);
    gr.fillEllipse(16, 26, 12, 30);
    gr.fillEllipse(26, 28, 12, 30);
    gr.fillEllipse(35, 25, 11, 27);
    gr.fillStyle(C.plantainDark, 0.8);
    gr.fillCircle(16, 20, 2); gr.fillCircle(26, 30, 2.5); gr.fillCircle(34, 22, 2);
    gr.fillStyle(0x6b4324, 1);
    gr.fillRect(18, 6, 16, 6);
    gr.generateTexture('good_plantain', 48, 48); gr.destroy();

    // Palm oil — amber bottle with red label
    gr = g(scene);
    gr.fillStyle(0x9ad1e8, 0.9);
    gr.fillRect(18, 6, 12, 8);
    gr.fillRect(14, 14, 20, 28);
    gr.fillStyle(C.palm, 1);
    gr.fillRect(15, 20, 18, 21);
    gr.fillStyle(C.red, 1);
    gr.fillRect(15, 28, 18, 8);
    gr.fillStyle(C.cream, 1);
    gr.fillCircle(24, 32, 2.5);
    gr.generateTexture('good_palmoil', 48, 48); gr.destroy();
}

// --- Customer avatars (72x96 busts) -----------------------------------------
function face(gr: ReturnType<Scene['add']['graphics']>, x: number, y: number): void {
    gr.fillStyle(0x8a5a3a, 1); gr.fillCircle(x, y, 13);
    gr.fillStyle(0x241a12, 1); gr.fillCircle(x - 4.5, y - 2, 1.8); gr.fillCircle(x + 4.5, y - 2, 1.8);
    gr.fillStyle(0xffffff, 0.9); gr.fillCircle(x - 4, y - 2.6, 0.7); gr.fillCircle(x + 5, y - 2.6, 0.7);
    gr.lineStyle(1.6, 0x3a2418, 1);
    gr.beginPath(); gr.arc(x, y + 3, 6, 0.25, Math.PI - 0.25); gr.strokePath();
}

export function createCustomerTextures(scene: Scene): void {
    // Mama Bimpe — Ankara headwrap + matching buba
    let gr = g(scene);
    gr.fillStyle(0xe85d2a, 1); gr.fillRect(10, 44, 52, 52);          // buba
    gr.fillStyle(0x2b8a6f, 1);
    for (let i = 0; i < 4; i++) gr.fillCircle(16 + i * 13, 58 + (i % 2) * 16, 4);
    gr.fillStyle(0xf6c445, 1);
    gr.fillCircle(36, 26, 15); gr.fillEllipse(36, 12, 40, 22);       // headwrap
    gr.fillStyle(0xd92b1c, 1); gr.fillCircle(36, 8, 6);
    face(gr, 36, 30);
    gr.generateTexture('cust_bimpe', 72, 96); gr.destroy();

    // Chief Ade — blue agbada + embroidered cap
    gr = g(scene);
    gr.fillStyle(0x1f4e8c, 1); gr.fillRect(6, 42, 60, 54);
    gr.fillStyle(0xf6c445, 1);
    gr.lineStyle(3, 0xf6c445, 1);
    gr.beginPath(); gr.moveTo(36, 46); gr.lineTo(36, 92); gr.strokePath();
    gr.strokeCircle(36, 62, 8);
    gr.fillStyle(0x16345e, 1); gr.fillEllipse(36, 16, 34, 14);       // cap
    gr.fillStyle(0xf6c445, 1); gr.fillCircle(36, 14, 3);
    face(gr, 36, 28);
    gr.generateTexture('cust_ade', 72, 96); gr.destroy();

    // Sister Amina — golden ochre hijab
    gr = g(scene);
    gr.fillStyle(0xc98a2b, 1); gr.fillRect(12, 46, 48, 50);
    gr.fillStyle(0xe8b04a, 1);
    gr.fillEllipse(36, 34, 56, 64);
    gr.fillStyle(0x8a5a3a, 1); gr.fillCircle(36, 30, 13);
    gr.fillStyle(0xe8b04a, 1);
    gr.fillEllipse(36, 12, 44, 20);
    gr.fillStyle(0x241a12, 1); gr.fillCircle(31.5, 28, 1.8); gr.fillCircle(40.5, 28, 1.8);
    gr.fillStyle(0xffffff, 0.9); gr.fillCircle(32, 27.4, 0.7); gr.fillCircle(41, 27.4, 0.7);
    gr.lineStyle(1.6, 0x3a2418, 1); gr.beginPath(); gr.arc(36, 33, 6, 0.25, Math.PI - 0.25); gr.strokePath();
    gr.generateTexture('cust_amina', 72, 96); gr.destroy();

    // Bolu the Banker — shirt + tie + wristwatch
    gr = g(scene);
    gr.fillStyle(0xeef3f8, 1); gr.fillRect(12, 44, 48, 52);
    gr.fillStyle(0xd92b1c, 1);
    gr.fillTriangle(36, 46, 30, 52, 36, 74);
    gr.fillTriangle(36, 46, 42, 52, 36, 74);
    gr.fillStyle(0x2b3a67, 1); gr.fillRect(8, 44, 10, 52); gr.fillRect(54, 44, 10, 52);
    gr.fillStyle(0x241a12, 1); gr.fillCircle(36, 24, 13);
    gr.fillStyle(0x111111, 1); gr.fillEllipse(36, 13, 28, 10);
    face(gr, 36, 26);
    gr.fillStyle(0xf6c445, 1); gr.fillCircle(14, 84, 4);
    gr.generateTexture('cust_bolu', 72, 96); gr.destroy();

    // Grandpa Tayo — traditional cap + beard + cane hint
    gr = g(scene);
    gr.fillStyle(0xf0e6d2, 1); gr.fillRect(12, 46, 48, 50);
    gr.fillStyle(0x2b8a6f, 1); gr.fillRect(12, 46, 48, 8);
    face(gr, 36, 28);
    gr.fillStyle(0xd8d8d8, 1);
    gr.fillEllipse(36, 40, 20, 12);
    gr.fillStyle(0xc96f4a, 1); gr.fillEllipse(36, 12, 30, 16);       // cap
    gr.fillStyle(0x8a4a22, 1); gr.fillCircle(36, 8, 3);
    gr.generateTexture('cust_tayo', 72, 96); gr.destroy();
}

// --- Environment -------------------------------------------------------------
export function createEnvironmentTextures(scene: Scene): void {
    // Terracotta ground tile with dust speckles (256x256)
    let gr = g(scene);
    gr.fillStyle(C.terracotta, 1); gr.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 90; i++) {
        const x = Math.random() * 256, y = Math.random() * 256;
        gr.fillStyle(Math.random() > 0.5 ? C.terracottaDark : 0xd98a5f, 0.5);
        gr.fillCircle(x, y, 1 + Math.random() * 2);
    }
    gr.generateTexture('ground', 256, 256); gr.destroy();

    // Wooden counter slab (540x120) with grain + cap highlight
    gr = g(scene);
    gr.fillStyle(C.wood, 1); gr.fillRect(0, 12, 540, 108);
    gr.fillStyle(C.woodLight, 1); gr.fillRect(0, 0, 540, 14);
    gr.lineStyle(2, C.woodDark, 0.7);
    for (let i = 0; i < 8; i++) {
        const y = 26 + i * 12;
        gr.beginPath(); gr.moveTo(0, y);
        for (let x = 0; x <= 540; x += 60) gr.lineTo(x, y + Math.sin(x * 0.05 + i) * 3);
        gr.strokePath();
    }
    for (let x = 0; x < 540; x += 90) { gr.lineStyle(3, 0x5a3a1e, 0.8); gr.lineBetween(x, 14, x, 120); }
    gr.generateTexture('counter', 540, 120); gr.destroy();

    // Corrugated tin roof band (540x46)
    gr = g(scene);
    gr.fillStyle(0x8f9aa6, 1); gr.fillRect(0, 0, 540, 46);
    for (let x = 0; x < 540; x += 18) {
        gr.fillStyle(0xaab6c2, 1); gr.fillRect(x, 0, 9, 46);
        gr.fillStyle(0x6f7a86, 1); gr.fillRect(x + 13, 0, 3, 46);
    }
    gr.fillStyle(0x4a5560, 1); gr.fillRect(0, 40, 540, 6);
    gr.generateTexture('roof', 540, 46); gr.destroy();

    // Ankara awning scallop strip (540x36)
    gr = g(scene);
    gr.fillStyle(C.adire, 1); gr.fillRect(0, 0, 540, 20);
    for (let x = 0; x < 540; x += 36) {
        gr.fillStyle(C.adire, 1);
        gr.fillTriangle(x, 20, x + 36, 20, x + 18, 38);
        gr.fillStyle(C.sun, 1); gr.fillCircle(x + 18, 26, 5);
        gr.fillStyle(0xe85d2a, 1); gr.fillCircle(x + 6, 22, 3);
        gr.fillStyle(0x2b8a6f, 1); gr.fillCircle(x + 30, 22, 3);
    }
    gr.generateTexture('awning', 540, 40); gr.destroy();

    // Bunting triangle (24x28)
    gr = g(scene);
    gr.fillStyle(C.sun, 1); gr.fillTriangle(0, 0, 24, 0, 12, 28);
    gr.generateTexture('bunting', 24, 28); gr.destroy();

    // Hanging pepper/garlic net (40x90)
    gr = g(scene);
    gr.lineStyle(2, 0x7a6a4a, 1); gr.lineBetween(20, 0, 20, 14);
    gr.fillStyle(0xe8dcc0, 0.9);
    for (let i = 0; i < 5; i++) gr.fillCircle(12 + (i % 2) * 14, 22 + i * 13, 7);
    gr.fillStyle(C.red, 0.95);
    for (let i = 0; i < 4; i++) gr.fillCircle(10 + (i % 2) * 16, 26 + i * 13, 4.5);
    gr.generateTexture('pepper_net', 40, 90); gr.destroy();

    // Speech bubble (180x70, tail bottom-left)
    gr = g(scene);
    gr.fillStyle(0xffffff, 0.96);
    gr.fillRoundedRect(0, 0, 180, 56, 14);
    gr.fillTriangle(28, 54, 48, 54, 34, 70);
    gr.lineStyle(2, 0xc9b89a, 1);
    gr.strokeRoundedRect(0, 0, 180, 56, 14);
    gr.generateTexture('bubble', 180, 70); gr.destroy();

    // Patience bar frame (140x14)
    gr = g(scene);
    gr.fillStyle(0x000000, 0.35); gr.fillRoundedRect(0, 0, 140, 14, 7);
    gr.generateTexture('bar_frame', 140, 14); gr.destroy();

    // Bin crate (150x120)
    gr = g(scene);
    gr.fillStyle(C.woodDark, 1); gr.fillRect(0, 0, 150, 120);
    gr.fillStyle(C.wood, 1); gr.fillRect(6, 6, 138, 108);
    gr.fillStyle(C.woodLight, 1);
    gr.fillRect(0, 0, 150, 10); gr.fillRect(0, 110, 150, 10);
    gr.fillRect(0, 0, 10, 120); gr.fillRect(140, 0, 10, 120);
    gr.lineStyle(2, 0x5a3a1e, 0.6);
    gr.lineBetween(10, 60, 140, 60);
    gr.generateTexture('crate', 150, 120); gr.destroy();

    // Paper money icon (40x24) naira note
    gr = g(scene);
    gr.fillStyle(0x2e8b57, 1); gr.fillRoundedRect(0, 0, 40, 24, 4);
    gr.fillStyle(0x54b383, 1); gr.fillRoundedRect(3, 3, 34, 18, 3);
    gr.fillStyle(0x1c5e3a, 1); gr.fillCircle(20, 12, 6);
    gr.lineStyle(2, 0xffffff, 1);
    gr.beginPath(); gr.moveTo(17, 9); gr.lineTo(23, 15); gr.moveTo(23, 9); gr.lineTo(17, 15);
    gr.strokePath();
    gr.generateTexture('note', 40, 24); gr.destroy();

    // Chicken (56x44)
    gr = g(scene);
    gr.fillStyle(0xf0e6d2, 1); gr.fillEllipse(24, 26, 30, 22);
    gr.fillStyle(0xd8c8a8, 1); gr.fillEllipse(38, 28, 14, 12);
    gr.fillStyle(0xf0e6d2, 1); gr.fillCircle(44, 14, 9);
    gr.fillStyle(0xd92b1c, 1); gr.fillCircle(44, 6, 4);
    gr.fillStyle(0xf6a625, 1); gr.fillTriangle(50, 14, 56, 16, 50, 18);
    gr.lineStyle(3, 0xf6a625, 1);
    gr.lineBetween(20, 36, 20, 42); gr.lineBetween(28, 36, 28, 42);
    gr.generateTexture('chicken', 56, 44); gr.destroy();

    // Crowd silhouette (60x120)
    gr = g(scene);
    gr.fillStyle(0x1a1420, 0.55);
    gr.fillCircle(30, 22, 14);
    gr.fillRoundedRect(12, 36, 36, 84, 14);
    gr.generateTexture('crowd', 60, 120); gr.destroy();

    // Rain drop streak (4x22)
    gr = g(scene);
    gr.fillStyle(0xbcd8e8, 0.8); gr.fillRoundedRect(0, 0, 4, 22, 2);
    gr.generateTexture('drop', 4, 22); gr.destroy();

    // Umbrella cover icon (64x56)
    gr = g(scene);
    gr.fillCircle(32, 26, 26);
    gr.fillStyle(C.adire, 1);
    gr.fillTriangle(6, 26, 32, 26, 14, 44);
    gr.fillTriangle(58, 26, 32, 26, 50, 44);
    gr.fillStyle(C.sun, 1); gr.fillCircle(20, 22, 5); gr.fillCircle(44, 22, 5);
    gr.lineStyle(4, C.woodDark, 1); gr.lineBetween(32, 26, 32, 54);
    gr.generateTexture('umbrella', 64, 56); gr.destroy();

    // Rival hawker banner (160x40)
    gr = g(scene);
    gr.fillStyle(0xd92b1c, 1); gr.fillRoundedRect(0, 0, 160, 40, 8);
    gr.fillStyle(0xffffff, 1); gr.fillRoundedRect(4, 4, 152, 32, 6);
    gr.fillStyle(0xd92b1c, 1); gr.fillRoundedRect(8, 8, 144, 24, 4);
    gr.generateTexture('hawker_banner', 160, 40); gr.destroy();

    // Serve button glow ring (160x160)
    gr = g(scene);
    gr.fillStyle(0xf6c445, 0.25); gr.fillCircle(80, 80, 78);
    gr.fillStyle(0xf6c445, 0.4); gr.fillCircle(80, 80, 60);
    gr.generateTexture('glow_ring', 160, 160); gr.destroy();
}