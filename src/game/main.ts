// ---------------------------------------------------------------------------
// Market Rush (Ìyà Alátà) — Phaser 4 single-scene game.
// Top-down arcade order-fulfillment in a West African open-air market.
// Portrait 540×960, Scale.FIT. All UI overlays live in React (App.tsx);
// this scene owns the market world, customers, bins, tray, haggling,
// distractions, day phases and scoring, bridged via EventBus.
// ---------------------------------------------------------------------------
import * as Phaser from 'phaser';
import { AUTO, Events, Game as PhaserGame, Scale, Scene } from 'phaser';
import {
    GOODS, goodById, CUSTOMER_NAMES, AudioEngine, tr,
    type Lang, type Settings, type HudState, type HaggleData, type DaySummary,
    loadHighNaira, saveHighNaira, DEFAULT_SETTINGS,
} from './utils';
import { createGoodsTextures, createCustomerTextures, createEnvironmentTextures } from '../sprites/textures';

export const GAME_WIDTH = 540;
export const GAME_HEIGHT = 960;

// --- EventBus + canonical event names ---------------------------------------
export const EventBus = new Events.EventEmitter();

export const EV = {
    PHASE: 'phase-changed',
    HUD: 'hud-updated',
    HAGGLE: 'haggle-opened',
    HAGGLE_CHOICE: 'haggle-choice',
    DISTRACTION: 'distraction-triggered',
    DISTRACTION_CLEARED: 'distraction-cleared',
    DAY_SUMMARY: 'day-summary',
    START: 'start-game',
    PAUSE: 'pause-game',
    RESUME: 'resume-game',
    RESTART: 'restart-game',
    HOME: 'return-home',
    SETTINGS: 'update-settings',
    SCENE_READY: 'current-scene-ready',
} as const;

// --- Layout constants ---------------------------------------------------------
const TRAY_MAX = 6;
const TOTAL_CUSTOMERS = 15;
const MAX_HEARTS = 5;
const CUST_X = 270, CUST_Y = 250;
const TRAY_Y = 560, TRAY_X0 = 70, TRAY_DX = 80;

interface OrderEntry { id: string; qty: number; }
interface Customer {
    sprite: Phaser.GameObjects.Image;
    bubble: Phaser.GameObjects.Container;
    bar: Phaser.GameObjects.Graphics;
    name: string;
    order: OrderEntry[];
    patience: number;      // seconds remaining
    maxPatience: number;
    canHaggle: boolean;
    leaving: boolean;
}

export class Game extends Scene {
    // run state
    private running = false;
    private paused = false;
    private naira = 0;
    private combo = 0;
    private bestCombo = 0;
    private hearts = MAX_HEARTS;
    private served = 0;
    private missed = 0;
    private customerIndex = 0;
    private tier: 'morning' | 'afternoon' | 'evening' = 'morning';
    private lang: Lang = 'en';
    private settings: Settings = { ...DEFAULT_SETTINGS };

    // world objects
    private bins: Phaser.GameObjects.Image[] = [];
    private binLabels: Phaser.GameObjects.Text[] = [];
    private trayItems: string[] = [];
    private trayIcons: Phaser.GameObjects.Image[] = [];
    private trayBag: Phaser.GameObjects.Container | null = null;
    private serveBtn: Phaser.GameObjects.Container | null = null;
    private clearBtn: Phaser.GameObjects.Container | null = null;
    private customer: Customer | null = null;
    private spawnTimer: Phaser.Time.TimerEvent | null = null;
    private distractionTimer: Phaser.Time.TimerEvent | null = null;
    private chicken: Phaser.GameObjects.Sprite | null = null;
    private chickenActive = false;
    private rainOverlay: Phaser.GameObjects.Container | null = null;
    private rainActive = false;
    private hawker: Phaser.GameObjects.Image | null = null;
    private hawkerActive = false;
    private hawkerBanner: Phaser.GameObjects.Text | null = null;
    private tintOverlay: Phaser.GameObjects.Rectangle | null = null;
    private comboText: Phaser.GameObjects.Text | null = null;
    private floatTexts: Phaser.GameObjects.Text[] = [];
    private waitingHaggle = false;
    private lastPayout = 0;

    constructor() { super('Game'); }

    // =========================================================================
    create(): void {
        createGoodsTextures(this);
        createCustomerTextures(this);
        createEnvironmentTextures(this);

        // --- backdrop ---------------------------------------------------------
        this.add.image(270, 700, 'ground').setDisplaySize(540, 520).setDepth(0);
        const sky = this.add.graphics().setDepth(0);
        sky.fillGradientStyle(0x9fd8e8, 0x9fd8e8, 0xf6e3c0, 0xf6e3c0, 1);
        sky.fillRect(0, 0, 540, 460);
        // distant crowd silhouettes
        for (let i = 0; i < 9; i++) {
            this.add.image(30 + i * 62, 175 + (i % 3) * 8, 'crowd')
                .setDisplaySize(46, 92)
                .setAlpha(0.35 + (i % 3) * 0.12)
                .setDepth(1);
        }
        // roof + awning + bunting
        this.add.image(270, 24, 'roof').setDepth(3);
        this.add.image(270, 66, 'awning').setDepth(3);
        for (let i = 0; i < 11; i++) {
            this.add.image(28 + i * 48, 96, 'bunting')
                .setTint([0xf6c445, 0xd92b1c, 0x2b8a6f, 0x2b3a67][i % 4])
                .setDepth(4);
        }
        this.add.image(505, 130, 'pepper_net').setDepth(4);
        this.add.image(35, 130, 'pepper_net').setDepth(4);
        // counter
        this.add.image(270, 420, 'counter').setDepth(5);

        // --- customer zone label ----------------------------------------------
        this.add.text(270, 345, '● YOUR CUSTOMER ●', {
            fontFamily: 'Verdana, sans-serif', fontSize: '13px', fontStyle: 'bold',
            color: '#5a3a1e',
        }).setOrigin(0.5).setDepth(6).setAlpha(0.7);

        // --- tray bag -----------------------------------------------------------
        this.trayBag = this.add.container(0, 0).setDepth(12);
        const bag = this.add.graphics();
        bag.fillStyle(0x8a5a33, 1); bag.fillRoundedRect(TRAY_X0 - 42, TRAY_Y - 40, TRAY_MAX * TRAY_DX + 4, 80, 14);
        bag.fillStyle(0xa9764a, 1); bag.fillRoundedRect(TRAY_X0 - 38, TRAY_Y - 36, TRAY_MAX * TRAY_DX - 4, 72, 12);
        bag.lineStyle(3, 0x5a3a1e, 1); bag.strokeRoundedRect(TRAY_X0 - 42, TRAY_Y - 40, TRAY_MAX * TRAY_DX + 4, 80, 14);
        this.trayBag.add(bag);
        this.add.text(TRAY_X0 - 30, TRAY_Y - 56, 'YOUR BAG', {
            fontFamily: 'Verdana, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#3a2418',
        }).setDepth(12);

        // --- bins (2 rows x 3) ---------------------------------------------------
        GOODS.forEach((good, i) => {
            const col = i % 3, row = Math.floor(i / 3);
            const x = 95 + col * 178, y = 730 + row * 132;
            const crate = this.add.image(x, y, 'crate').setDepth(10).setInteractive();
            crate.on('pointerdown', () => this.addToTray(good.id));
            crate.on('pointerover', () => crate.setTint(0xffe9b0));
            crate.on('pointerout', () => crate.clearTint());
            this.bins.push(crate);
            this.add.image(x, y - 14, good.key).setDisplaySize(56, 56).setDepth(11);
            const label = this.add.text(x, y + 40, `${i + 1}. ${good.name[this.lang]}`, {
                fontFamily: 'Verdana, sans-serif', fontSize: '14px', fontStyle: 'bold',
                color: '#fff3dc', stroke: '#3a2418', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(11);
            this.binLabels.push(label);
            this.add.text(x + 62, y - 48, `₦${good.price}`, {
                fontFamily: 'Verdana, sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#1c5e3a',
            }).setOrigin(0.5).setDepth(11);
        });

        // --- serve + clear buttons ------------------------------------------------
        this.serveBtn = this.makeButton(420, 640, 120, 0x2e8b57, 'SERVE!', () => this.serve());
        this.clearBtn = this.makeButton(120, 640, 92, 0xc96f4a, 'CLEAR', () => this.clearTray());

        // --- combo shout text ------------------------------------------------------
        this.comboText = this.add.text(270, 500, ' ', {
            fontFamily: 'Verdana, sans-serif', fontSize: '26px', fontStyle: 'bold',
            color: '#f6c445', stroke: '#7a3b12', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(30).setAlpha(0);

        // --- rain overlay container --------------------------------------------------
        this.rainOverlay = this.add.container(0, 0).setDepth(40).setAlpha(0);
        const rainTint = this.add.rectangle(270, 480, 540, 960, 0x2b3a67, 0.28);
        this.rainOverlay.add(rainTint);
        const drops: Phaser.GameObjects.Image[] = [];
        for (let i = 0; i < 40; i++) {
            const d = this.add.image(Math.random() * 540, Math.random() * 960, 'drop').setAlpha(0.7);
            drops.push(d); this.rainOverlay.add(d);
            this.tweens.add({ targets: d, y: 960, duration: 350 + Math.random() * 250, repeat: -1, delay: Math.random() * 400 });
        }
        this.rainOverlay.list.push(this.add.image(270, 300, 'umbrella').setScale(1.4).setInteractive());
        const umb = this.rainOverlay.list[this.rainOverlay.list.length - 1] as Phaser.GameObjects.Image;
        umb.on('pointerdown', () => this.clearRain());
        this.rainOverlay.setVisible(false);

        // --- chicken -------------------------------------------------------------------
        this.chicken = this.add.sprite(560, 660, 'chicken').setDepth(20).setVisible(false).setInteractive();
        this.chicken.on('pointerdown', () => this.shooChicken());

        // --- hawker ----------------------------------------------------------------------
        this.hawker = this.add.image(600, 150, 'hawker_banner').setDepth(25).setVisible(false).setInteractive();
        this.hawker.on('pointerdown', () => this.clearHawker());
        this.hawkerBanner = this.add.text(600, 150, 'CHEAP! CHEAP!', {
            fontFamily: 'Verdana, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffffff',
        }).setOrigin(0.5).setDepth(26).setVisible(false);

        // --- daylight tint overlay ----------------------------------------------------------
        this.tintOverlay = this.add.rectangle(270, 480, 540, 960, 0xffd98a, 0.06)
            .setDepth(35).setBlendMode('MULTIPLY');

        // --- input: keyboard shortcuts ---------------------------------------------------------
        const keys = this.input.keyboard!.addKeys('ONE,TWO,THREE,FOUR,FIVE,SIX,C,ENTER,SPACE,ESC') as
            Record<string, Phaser.Input.Keyboard.Key>;
        const binKey = (k: Phaser.Input.Keyboard.Key | undefined, idx: number) => {
            k?.on('down', () => { if (this.running && !this.paused) this.addToTray(GOODS[idx].id); });
        };
        [keys.ONE, keys.TWO, keys.THREE, keys.FOUR, keys.FIVE, keys.SIX].forEach((k, i) => binKey(k, i));
        keys.C?.on('down', () => { if (this.running && !this.paused) this.clearTray(); });
        keys.ENTER?.on('down', () => { if (this.running && !this.paused) this.serve(); });
        keys.SPACE?.on('down', () => { if (this.running && !this.paused) this.serve(); });
        keys.ESC?.on('down', () => { if (this.running) this.togglePause(); });

        // --- EventBus commands from React -------------------------------------------------------
        EventBus.on(EV.START, this.startDay, this);
        EventBus.on(EV.RESTART, this.startDay, this);
        EventBus.on(EV.PAUSE, this.togglePause, this);
        EventBus.on(EV.RESUME, this.resumeGame, this);
        EventBus.on(EV.HAGGLE_CHOICE, this.onHaggleChoice, this);
        EventBus.on(EV.SETTINGS, this.onSettings, this);
        EventBus.on(EV.HOME, this.returnHome, this);

        this.events.on('shutdown', () => {
            EventBus.off(EV.START, this.startDay, this);
            EventBus.off(EV.RESTART, this.startDay, this);
            EventBus.off(EV.PAUSE, this.togglePause, this);
            EventBus.off(EV.RESUME, this.resumeGame, this);
            EventBus.off(EV.HAGGLE_CHOICE, this.onHaggleChoice, this);
            EventBus.off(EV.SETTINGS, this.onSettings, this);
            EventBus.off(EV.HOME, this.returnHome, this);
        });

        this.emitHud();
        EventBus.emit(EV.SCENE_READY, this);
    }

    // =========================================================================
    // Per-frame: patience drain + cleanup
    update(_time: number, delta: number): void {
        if (!this.running || this.paused || !this.customer || this.waitingHaggle) return;
        const dt = delta / 1000;
        const c = this.customer;
        if (c.leaving) return;
        let drain = dt;
        if (this.chickenActive) drain *= 1.5;
        if (this.rainActive) drain *= 1.4;
        if (this.hawkerActive) drain *= 1.3;
        c.patience -= drain;
        this.drawBar(c);
        if (c.patience <= 0) this.customerWalksAway();
    }

    // =========================================================================
    // Day lifecycle
    private startDay(): void {
        this.clearCustomer();
        this.running = true;
        this.paused = false;
        this.naira = 0; this.combo = 0; this.bestCombo = 0;
        this.hearts = MAX_HEARTS; this.served = 0; this.missed = 0;
        this.customerIndex = 0; this.tier = 'morning';
        this.waitingHaggle = false;
        this.clearTray();
        this.stopAllDistractions();
        AudioEngine.resume();
        AudioEngine.startMusic('calm');
        this.emitHud();
        this.scheduleSpawn(700);
    }

    private scheduleSpawn(delay: number): void {
        if (this.spawnTimer) this.spawnTimer.remove();
        this.spawnTimer = this.time.delayedCall(delay, () => this.spawnCustomer());
    }

    private tierForIndex(i: number): 'morning' | 'afternoon' | 'evening' {
        if (i < 4) return 'morning';
        if (i < 9) return 'afternoon';
        return 'evening';
    }

    private spawnCustomer(): void {
        if (!this.running) return;
        if (this.customerIndex >= TOTAL_CUSTOMERS || this.hearts <= 0) { this.endDay(); return; }
        this.tier = this.tierForIndex(this.customerIndex);
        this.applyDaylight();
        AudioEngine.setMusicIntensity(this.tier === 'evening' ? 'rush' : 'calm');

        const archetypes = ['cust_bimpe', 'cust_ade', 'cust_amina', 'cust_bolu', 'cust_tayo'];
        const tex = archetypes[this.customerIndex % archetypes.length];
        const name = CUSTOMER_NAMES[this.customerIndex % CUSTOMER_NAMES.length];

        const sprite = this.add.image(620, CUST_Y, tex).setDepth(15).setScale(1.15);
        // order
        const order: OrderEntry[] = [];
        const kinds = this.tier === 'morning' ? 1 + (Math.random() < 0.4 ? 1 : 0)
            : this.tier === 'afternoon' ? 2 + (Math.random() < 0.4 ? 1 : 0)
            : 2 + Math.floor(Math.random() * 3);
        const pool = [...GOODS].sort(() => Math.random() - 0.5);
        for (let i = 0; i < kinds; i++) {
            order.push({ id: pool[i % pool.length].id, qty: 1 + Math.floor(Math.random() * (this.tier === 'evening' ? 3 : 2)) });
        }
        // bubble with order icons
        const bubble = this.add.container(0, 0).setDepth(16);
        const bg = this.add.image(0, -118, 'bubble');
        bubble.add(bg);
        const title = this.add.text(-78, -150, `${name}`, {
            fontFamily: 'Verdana, sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#3a2418',
        });
        bubble.add(title);
        const wantLabel = this.add.text(-78, -132, this.trKey('your_order') + ':', {
            fontFamily: 'Verdana, sans-serif', fontSize: '11px', color: '#6a5a4a',
        });
        bubble.add(wantLabel);
        order.forEach((o, i) => {
            const gx = -60 + i * 62;
            bubble.add(this.add.image(gx, -96, goodById(o.id).key).setDisplaySize(34, 34));
            bubble.add(this.add.text(gx + 16, -86, `x${o.qty}`, {
                fontFamily: 'Verdana, sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#d92b1c',
            }));
        });
        bubble.setPosition(CUST_X, CUST_Y).setAlpha(0);
        this.tweens.add({ targets: bubble, alpha: 1, duration: 300 });

        const bar = this.add.graphics().setDepth(16);
        const maxPatience = this.tier === 'morning' ? 20 : this.tier === 'afternoon' ? 16 : 12;
        this.customer = { sprite, bubble, bar, name, order, patience: maxPatience, maxPatience, canHaggle: this.tier !== 'morning', leaving: false };

        this.tweens.add({
            targets: sprite, x: CUST_X, duration: 700, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({ targets: sprite, y: CUST_Y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
                this.maybeStartDistractions();
            },
        });
        this.emitHud();
    }

    private drawBar(c: Customer): void {
        c.bar.clear();
        const ratio = Math.max(0, c.patience / c.maxPatience);
        const w = 140 * ratio;
        c.bar.fillStyle(0x000000, 0.35); c.bar.fillRoundedRect(CUST_X - 70, 318, 140, 10, 5);
        const col = ratio > 0.5 ? 0x2e8b57 : ratio > 0.25 ? 0xf6c445 : 0xd92b1c;
        c.bar.fillStyle(col, 1); c.bar.fillRoundedRect(CUST_X - 70, 318, w, 10, 5);
    }

    // =========================================================================
    // Tray
    private addToTray(id: string): void {
        if (!this.running || this.paused || this.trayItems.length >= TRAY_MAX) return;
        this.trayItems.push(id);
        const idx = this.trayItems.length - 1;
        const icon = this.add.image(TRAY_X0 + idx * TRAY_DX, TRAY_Y, goodById(id).key)
            .setDisplaySize(48, 48).setDepth(13).setInteractive();
        icon.on('pointerdown', () => this.removeFromTray(idx));
        icon.setOrigin(0.5);
        this.trayIcons.push(icon);
        this.tweens.add({ targets: icon, scale: icon.scale * 1.15, duration: 80, yoyo: true });
        AudioEngine.playSfx('shaker');
        this.safePlay('sfx_button');
    }

    private removeFromTray(index: number): void {
        if (!this.running || this.paused) return;
        if (index < 0 || index >= this.trayItems.length) return;
        this.trayItems.splice(index, 1);
        const icon = this.trayIcons[index];
        if (icon) { icon.destroy(); this.trayIcons.splice(index, 1); }
        this.relayoutTray();
        AudioEngine.playSfx('thud');
    }

    private clearTray(): void {
        this.trayItems = [];
        this.trayIcons.forEach(i => i.destroy());
        this.trayIcons = [];
        AudioEngine.playSfx('buzz');
    }

    private relayoutTray(): void {
        this.trayIcons.forEach((icon, i) => {
            icon.setPosition(TRAY_X0 + i * TRAY_DX, TRAY_Y);
            icon.removeAllListeners('pointerdown');
            icon.on('pointerdown', () => this.removeFromTray(i));
        });
    }

    // =========================================================================
    // Serving
    private serve(): void {
        const c = this.customer;
        if (!c || c.leaving || this.waitingHaggle) return;
        if (this.trayItems.length === 0) return;
        const need = new Map<string, number>();
        c.order.forEach(o => need.set(o.id, (need.get(o.id) || 0) + o.qty));
        const got = new Map<string, number>();
        this.trayItems.forEach(id => got.set(id, (got.get(id) || 0) + 1));
        const correct = need.size === got.size &&
            [...need.entries()].every(([id, qty]) => got.get(id) === qty);

        if (!correct) {
            this.hearts -= 1;
            this.combo = 0;
            this.floatText(CUST_X, 300, this.trKey('error_wrong'), '#d92b1c');
            AudioEngine.playSfx('buzz');
            this.safePlay('sfx_hit');
            this.cameras.main.shake(180, 0.008);
            this.emitHud();
            if (this.hearts <= 0) { this.customerWalksAway(); }
            return;
        }

        // correct order — compute payout
        let base = 0;
        c.order.forEach(o => { base += goodById(o.id).price * o.qty; });
        const speedBonus = 1 + (c.patience / c.maxPatience) * 0.5;
        this.combo += 1;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        const comboMult = Math.min(1 + (this.combo - 1) * 0.25, 3.5);
        let payout = Math.round(base * speedBonus * comboMult);
        this.lastPayout = payout;

        if (c.canHaggle && Math.random() < 0.55) {
            // open haggle modal — payout resolved by choice
            this.waitingHaggle = true;
            const offered = Math.round(payout * 0.6);
            const data: HaggleData = {
                customerName: c.name, originalPrice: payout, offeredPrice: offered,
                textKey: this.tier === 'evening' ? 'haggle_firm' : 'haggle_accept',
            };
            EventBus.emit(EV.HAGGLE, data);
            return;
        }
        this.completeSale(payout);
    }

    private completeSale(payout: number): void {
        this.naira += payout;
        this.served += 1;
        this.customerIndex += 1;
        const shout = this.combo >= 3 ? this.trKey('combo_shout_3')
            : this.combo === 2 ? this.trKey('combo_shout_2')
            : this.trKey('combo_shout_1');
        this.floatText(CUST_X, 280, `+₦${payout}`, '#2e8b57');
        this.showCombo(this.combo > 1 ? `${shout}  x${this.combo}` : shout);
        AudioEngine.playSfx('coin');
        AudioEngine.playSfx('chime');
        this.safePlay('sfx_collect');
        this.sparkle(CUST_X, CUST_Y);
        this.emitHud();
        this.exitCustomer(true);
    }

    private onHaggleChoice(choice: 'accept' | 'counter' | 'firm'): void {
        if (!this.waitingHaggle) return;
        this.waitingHaggle = false;
        const c = this.customer;
        if (!c) return;
        let payout: number;
        if (choice === 'accept') {
            payout = Math.round(this.lastPayout * 0.75);
            this.floatText(CUST_X, 280, `₦${payout}`, '#c96f4a');
        } else if (choice === 'counter') {
            payout = Math.round(this.lastPayout * 0.9);
            this.floatText(CUST_X, 280, `₦${payout}`, '#2e8b57');
        } else {
            if (Math.random() < 0.8) {
                payout = Math.round(this.lastPayout * 1.1);
                this.floatText(CUST_X, 280, `₦${payout}!`, '#2e8b57');
            } else {
                this.floatText(CUST_X, 280, this.trKey('error_late'), '#d92b1c');
                this.hearts -= 1;
                this.missed += 1;
                this.combo = 0;
                this.customerIndex += 1;
                AudioEngine.playSfx('buzz');
                this.emitHud();
                this.exitCustomer(false);
                if (this.hearts <= 0) this.endDay();
                return;
            }
        }
        AudioEngine.playSfx('talk');
        this.completeSale(payout);
    }

    private customerWalksAway(): void {
        const c = this.customer;
        if (!c || c.leaving) return;
        this.hearts -= 1;
        this.missed += 1;
        this.combo = 0;
        this.customerIndex += 1;
        this.floatText(CUST_X, 280, this.trKey('error_late'), '#d92b1c');
        AudioEngine.playSfx('thud');
        this.safePlay('sfx_hit');
        this.emitHud();
        this.exitCustomer(false);
        if (this.hearts <= 0) this.endDay();
    }

    private exitCustomer(happy: boolean): void {
        const c = this.customer;
        if (!c) return;
        c.leaving = true;
        this.tweens.add({
            targets: [c.sprite, c.bubble],
            x: happy ? -120 : 660, alpha: happy ? 1 : 0.4, duration: 550, ease: 'Cubic.easeIn',
            onComplete: () => { this.clearCustomer(); if (this.running && this.hearts > 0) this.scheduleSpawn(500); },
        });
        c.bar.clear();
    }

    private clearCustomer(): void {
        if (this.customer) {
            this.customer.sprite.destroy();
            this.customer.bubble.destroy(true);
            this.customer.bar.destroy();
            this.customer = null;
        }
    }

    private endDay(): void {
        this.running = false;
        this.clearCustomer();
        this.stopAllDistractions();
        AudioEngine.stopMusic();
        const prevHigh = loadHighNaira();
        const isNewBest = this.naira > prevHigh;
        if (isNewBest) saveHighNaira(this.naira);
        const summary: DaySummary = {
            earnedNaira: this.naira, served: this.served, missed: this.missed,
            bestCombo: this.bestCombo, isNewBest, highNaira: Math.max(prevHigh, this.naira),
        };
        this.safePlay(this.hearts > 0 ? 'sfx_win' : 'sfx_gameover');
        EventBus.emit(EV.DAY_SUMMARY, summary);
        EventBus.emit(EV.PHASE, 'FINISHED');
    }

    private returnHome(): void {
        this.running = false; this.paused = false;
        this.clearCustomer(); this.clearTray(); this.stopAllDistractions();
        AudioEngine.stopMusic();
        this.applyDaylight();
    }

    // =========================================================================
    // Pause
    private togglePause(): void {
        if (!this.running) return;
        this.paused = !this.paused;
        if (this.paused) {
            this.tweens.pauseAll();
            AudioEngine.stopMusic();
            EventBus.emit(EV.PHASE, 'PAUSED');
        } else {
            this.tweens.resumeAll();
            AudioEngine.startMusic(this.tier === 'evening' ? 'rush' : 'calm');
            EventBus.emit(EV.PHASE, 'PLAYING');
        }
    }

    private resumeGame(): void {
        if (this.paused) this.togglePause();
    }

    // =========================================================================
    // Distractions
    private maybeStartDistractions(): void {
        if (this.distractionTimer) this.distractionTimer.remove();
        if (this.tier === 'morning' && Math.random() < 0.5) return;
        const delay = 4000 + Math.random() * 6000;
        this.distractionTimer = this.time.delayedCall(delay, () => this.triggerRandomDistraction());
    }

    private triggerRandomDistraction(): void {
        if (!this.running || this.paused) return;
        const roll = Math.random();
        if (roll < 0.4) this.startChicken();
        else if (roll < 0.7) this.startRain();
        else this.startHawker();
    }

    private startChicken(): void {
        if (!this.chicken || this.chickenActive) return;
        this.chickenActive = true;
        this.chicken.setVisible(true).setPosition(560, 640);
        this.tweens.add({
            targets: this.chicken, x: -60, duration: 9000, ease: 'Linear',
            onComplete: () => { if (this.chickenActive) this.chickenSteal(); },
        });
        this.tweens.add({ targets: this.chicken, y: { from: 620, to: 700 }, duration: 700, yoyo: true, repeat: -1 });
        this.chicken.setFlipX(true);
        AudioEngine.playSfx('talk');
        EventBus.emit(EV.DISTRACTION, { type: 'chicken', message: this.trKey('distraction_chicken') });
    }

    private shooChicken(): void {
        if (!this.chicken || !this.chickenActive) return;
        this.chickenActive = false;
        this.tweens.add({ targets: this.chicken, x: -80, angle: 20, duration: 400, onComplete: () => this.chicken?.setVisible(false) });
        this.naira += 50;
        this.floatText(this.chicken.x, this.chicken.y, '+₦50', '#2e8b57');
        AudioEngine.playSfx('drum');
        EventBus.emit(EV.DISTRACTION_CLEARED, { type: 'chicken' });
        this.emitHud();
    }

    private chickenSteal(): void {
        this.chickenActive = false;
        if (this.trayIcons.length > 0) {
            const idx = this.trayIcons.length - 1;
            const icon = this.trayIcons[idx];
            this.tweens.add({ targets: icon, x: this.chicken!.x, y: this.chicken!.y, duration: 250, onComplete: () => icon.destroy() });
            this.trayItems.pop(); this.trayIcons.pop();
            this.relayoutTray();
        }
        this.tweens.add({ targets: this.chicken, x: -80, duration: 500, onComplete: () => this.chicken?.setVisible(false) });
        AudioEngine.playSfx('buzz');
        EventBus.emit(EV.DISTRACTION_CLEARED, { type: 'chicken' });
    }

    private startRain(): void {
        if (!this.rainOverlay || this.rainActive) return;
        this.rainActive = true;
        this.rainOverlay.setVisible(true);
        this.tweens.add({ targets: this.rainOverlay, alpha: 1, duration: 400 });
        AudioEngine.playSfx('rain');
        EventBus.emit(EV.DISTRACTION, { type: 'rain', message: this.trKey('distraction_rain') });
    }

    private clearRain(): void {
        if (!this.rainOverlay || !this.rainActive) return;
        this.rainActive = false;
        this.tweens.add({ targets: this.rainOverlay, alpha: 0, duration: 400, onComplete: () => this.rainOverlay?.setVisible(false) });
        this.naira += 30;
        this.floatText(270, 300, '+₦30', '#2e8b57');
        AudioEngine.playSfx('chime');
        EventBus.emit(EV.DISTRACTION_CLEARED, { type: 'rain' });
        this.emitHud();
    }

    private startHawker(): void {
        if (!this.hawker || this.hawkerActive) return;
        this.hawkerActive = true;
        this.hawker.setVisible(true).setPosition(600, 150);
        this.hawkerBanner?.setVisible(true).setPosition(600, 150);
        this.tweens.add({
            targets: [this.hawker, this.hawkerBanner], x: 270, duration: 600, ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({ targets: [this.hawker, this.hawkerBanner], x: { from: 250, to: 290 }, duration: 400, yoyo: true, repeat: -1 });
            },
        });
        AudioEngine.playSfx('buzz');
        EventBus.emit(EV.DISTRACTION, { type: 'hawker', message: this.trKey('distraction_hawker') });
    }

    private clearHawker(): void {
        if (!this.hawker || !this.hawkerActive) return;
        this.hawkerActive = false;
        this.tweens.add({
            targets: [this.hawker, this.hawkerBanner], x: -200, duration: 400,
            onComplete: () => { this.hawker?.setVisible(false); this.hawkerBanner?.setVisible(false); },
        });
        this.naira += 20;
        AudioEngine.playSfx('drum');
        EventBus.emit(EV.DISTRACTION_CLEARED, { type: 'hawker' });
        this.emitHud();
    }

    /** Public bridge for React distraction banner taps. */
    clearDistraction(type: string): void {
        if (type === 'chicken') this.shooChicken();
        else if (type === 'rain') this.clearRain();
        else if (type === 'hawker') this.clearHawker();
    }

    private stopAllDistractions(): void {
        if (this.distractionTimer) { this.distractionTimer.remove(); this.distractionTimer = null; }
        this.chickenActive = false; this.rainActive = false; this.hawkerActive = false;
        this.chicken?.setVisible(false); this.chicken?.setX(560);
        this.rainOverlay?.setVisible(false); this.rainOverlay?.setAlpha(0);
        this.hawker?.setVisible(false); this.hawkerBanner?.setVisible(false);
    }

    // =========================================================================
    // Polish helpers
    private makeButton(x: number, y: number, r: number, color: number, label: string, onTap: () => void): Phaser.GameObjects.Container {
        const cont = this.add.container(x, y).setDepth(14);
        const glow = this.add.image(0, 0, 'glow_ring').setAlpha(0.5);
        const circ = this.add.circle(0, 0, r / 2, color).setStrokeStyle(4, 0xffffff, 0.8);
        const txt = this.add.text(0, 0, label, {
            fontFamily: 'Verdana, sans-serif', fontSize: r > 100 ? '20px' : '14px', fontStyle: 'bold', color: '#ffffff',
        }).setOrigin(0.5);
        cont.add([glow, circ, txt]);
        circ.setInteractive({ useHandCursor: true });
        circ.on('pointerdown', () => {
            this.tweens.add({ targets: cont, scale: 0.9, duration: 60, yoyo: true });
            onTap();
        });
        this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
        return cont;
    }

    private floatText(x: number, y: number, msg: string, color: string): void {
        const t = this.add.text(x, y, msg, {
            fontFamily: 'Verdana, sans-serif', fontSize: '22px', fontStyle: 'bold',
            color, stroke: '#ffffff', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(32);
        this.floatTexts.push(t);
        this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    }

    private showCombo(msg: string): void {
        if (!this.comboText) return;
        this.comboText.setText(msg).setAlpha(1).setScale(0.6);
        this.tweens.add({ targets: this.comboText, scale: 1.1, duration: 180, yoyo: true, ease: 'Back.easeOut' });
        this.tweens.add({ targets: this.comboText, alpha: 0, duration: 900, delay: 500 });
    }

    private sparkle(x: number, y: number): void {
        for (let i = 0; i < 10; i++) {
            const p = this.add.circle(x, y, 4 + Math.random() * 4, [0xf6c445, 0x2e8b57, 0xffffff][i % 3]).setDepth(31);
            const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
            this.tweens.add({
                targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 30, alpha: 0, scale: 0.2,
                duration: 500 + Math.random() * 300, onComplete: () => p.destroy(),
            });
        }
    }

    private applyDaylight(): void {
        if (!this.tintOverlay) return;
        if (this.tier === 'morning') this.tintOverlay.setFillStyle(0xfff2cc, 0.05);
        else if (this.tier === 'afternoon') this.tintOverlay.setFillStyle(0xffe08a, 0.1);
        else this.tintOverlay.setFillStyle(0x2b3a67, 0.22);
    }

    private trKey(k: string): string {
        return tr(k, this.lang);
    }

    private safePlay(key: string): void {
        if (this.cache.audio.exists(key)) {
            const vol = this.settings.sfxVol * this.settings.masterVol;
            if (vol > 0.01) this.sound.play(key, { volume: Math.min(1, vol) });
        }
    }

    private emitHud(): void {
        const hud: HudState = {
            naira: this.naira, combo: this.combo, hearts: this.hearts,
            phaseName: this.tier, customerCount: Math.min(this.customerIndex + 1, TOTAL_CUSTOMERS),
            totalCustomers: TOTAL_CUSTOMERS,
        };
        EventBus.emit(EV.HUD, hud);
    }

    private onSettings(s: Settings): void {
        this.settings = s;
        AudioEngine.setVolumes(s.masterVol, s.musicVol, s.sfxVol);
        if (s.language !== this.lang) {
            this.lang = s.language;
            this.binLabels.forEach((label, i) => {
                label.setText(`${i + 1}. ${GOODS[i].name[s.language]}`);
            });
        }
    }
}

// --- preload audio + shared assets -------------------------------------------
// (declared as part of the scene via a tiny wrapper scene pattern is overkill;
//  we hook preload directly on Game)
(Game.prototype as unknown as { preload: () => void }).preload = function (this: Game): void {
    const sfx = [
        ['sfx_collect', 'assets/audio/sfx_collect.mp3'],
        ['sfx_button', 'assets/audio/sfx_button.mp3'],
        ['sfx_hit', 'assets/audio/sfx_hit.mp3'],
        ['sfx_win', 'assets/audio/sfx_win.mp3'],
        ['sfx_gameover', 'assets/audio/sfx_gameover.mp3'],
        ['sfx_powerup', 'assets/audio/sfx_powerup.mp3'],
    ];
    sfx.forEach(([k, p]) => { if (!this.cache.audio.has(k)) this.load.audio(k, p); });
};

// --- Game factory ---------------------------------------------------------------
export const StartGame = (parent: string): PhaserGame => {
    const game = new PhaserGame({
        parent,
        type: AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: '#f6e3c0',
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH,
        },
        physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
        scene: [Game],
    });
    if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;
        (window as unknown as Record<string, unknown>).__PHASER_EVENT_BUS__ = EventBus;
    }
    return game;
};

export { loadHighNaira };