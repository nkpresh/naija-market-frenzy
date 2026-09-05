// ---------------------------------------------------------------------------
// Market Rush — shared types, i18n content matrix, procedural audio engine,
// and localStorage persistence helpers.
// ---------------------------------------------------------------------------

export type GamePhase =
    | 'BOOT' | 'MENU' | 'HOW_TO_PLAY' | 'SETTINGS'
    | 'PLAYING' | 'PAUSED' | 'FINISHED';

export type Lang = 'en' | 'yo' | 'pid';

export interface Settings {
    masterVol: number;
    musicVol: number;
    sfxVol: number;
    language: Lang;
    haptics: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    masterVol: 0.8, musicVol: 0.55, sfxVol: 0.8, language: 'en', haptics: true,
};

export interface HudState {
    naira: number;
    combo: number;
    hearts: number;
    phaseName: string;
    customerCount: number;
    totalCustomers: number;
}

export interface HaggleData {
    customerName: string;
    originalPrice: number;
    offeredPrice: number;
    textKey: string;
}

export interface DaySummary {
    earnedNaira: number;
    served: number;
    missed: number;
    bestCombo: number;
    isNewBest: boolean;
    highNaira: number;
}

// --- Goods -----------------------------------------------------------------
export interface GoodDef {
    key: string;      // texture key
    id: string;       // logical id
    name: Record<Lang, string>;
    price: number;    // base naira per unit
    color: number;
}

export const GOODS: GoodDef[] = [
    { key: 'good_ata',     id: 'ata',     name: { en: 'Ata Rodo',  yo: 'Ata Rodo', pid: 'Rodo Pepper' }, price: 150, color: 0xd92b1c },
    { key: 'good_tomato',  id: 'tomato',  name: { en: 'Tomatoes',  yo: 'Tomati',   pid: 'Tomato' },      price: 120, color: 0xe8402a },
    { key: 'good_alubosa', id: 'alubosa', name: { en: 'Onions',    yo: 'Alùbòsà',  pid: 'Onion' },       price: 100, color: 0x8e3b8f },
    { key: 'good_crayfish',id: 'crayfish',name: { en: 'Crayfish',  yo: 'Èkpẹ̀ Odò', pid: 'Crayfish' },    price: 200, color: 0xb0632b },
    { key: 'good_plantain',id: 'plantain',name: { en: 'Plantain',  yo: 'Ógẹ̀dẹ̀',   pid: 'Plantain' },    price: 90,  color: 0xf2c531 },
    { key: 'good_palmoil', id: 'palmoil', name: { en: 'Palm Oil',  yo: 'Epo Pupa', pid: 'Palm Oil' },    price: 250, color: 0xc44a08 },
];

export const goodById = (id: string): GoodDef => GOODS.find(g => g.id === id) || GOODS[0];

// --- Customers ---------------------------------------------------------------
export const CUSTOMER_NAMES = [
    'Mama Bimpe', 'Chief Ade', 'Sister Amina', 'Bolu the Banker', 'Grandpa Tayo',
    'Aunty Ronke', 'Tunde Taxi', 'Nnechi Trader', 'Alhaji Musa', 'Miss Funke',
    'Baba Sola', 'Mama Nkechi', 'Emeka Runner', 'Iya Segun', 'Dayo Driver',
];

// --- i18n matrix ---------------------------------------------------------------
type Dict = Record<string, Record<Lang, string>>;

export const T: Dict = {
    title:          { en: 'MARKET RUSH', yo: 'MARKET RUSH', pid: 'MARKET RUSH' },
    subtitle:       { en: 'Ìyà Alátà', yo: 'Ìyà Alátà', pid: 'Ìyà Alátà' },
    play:           { en: 'Open Stall', yo: 'Bẹ̀rẹ̀ Ọjọ́', pid: 'Open Market' },
    how_to_play:    { en: 'How to Play', yo: 'Bí a ṣe ń gbá', pid: 'How to Play' },
    settings:       { en: 'Settings', yo: 'Ètò', pid: 'Settings' },
    back:           { en: 'Back', yo: 'Padà', pid: 'Back' },
    resume:         { en: 'Resume', yo: 'Tẹ̀síwájú', pid: 'Continue' },
    quit_menu:      { en: 'Quit to Home', yo: 'Jáde sí Ilé', pid: 'Go Home' },
    morning:        { en: 'Morning', yo: 'Àárọ̀', pid: 'Morning' },
    afternoon:      { en: 'Afternoon', yo: 'Ọ̀sán', pid: 'Afternoon' },
    evening:        { en: 'Evening Rush', yo: 'Ìrọ̀lẹ́', pid: 'Evening Rush' },
    serve:          { en: 'SERVE!', yo: 'GBÀ Á!', pid: 'SERVE AM!' },
    clear_tray:     { en: 'Clear Bag', yo: 'Nu Àpò Nù', pid: 'Clear Bag' },
    haggle_title:   { en: 'Customer is Haggling!', yo: 'Oníbàárà fẹ́ dúnádúrà!', pid: 'Customer dey Price!' },
    haggle_accept:  { en: '"I agree, take it"', yo: '"Mo gbà, mú un"', pid: '"Oya take am"' },
    haggle_counter: { en: '"Meet in the middle"', yo: '"Ẹ jẹ́ ká bùkún un"', pid: '"Let us meet for middle"' },
    haggle_firm:    { en: '"Fixed price, quality!"', yo: '"Iye kan náà ni!"', pid: '"Original goods, no discount!"' },
    distraction_chicken: { en: 'Shoo the chicken away!', yo: 'Lé adìyẹ náà kúrò!', pid: 'Drive that chicken commot!' },
    distraction_rain:    { en: 'Cover the goods! Rain!', yo: 'Bo ọjà mọ́lẹ̀! Òjò ń rọ̀!', pid: 'Cover market! Rain dey fall!' },
    distraction_hawker:  { en: 'Ignore the rival hawker!', yo: 'Má fetí sí elòmíràn!', pid: 'No mind that noisy neighbor!' },
    day_complete:   { en: 'Market Day Closed!', yo: 'Ọjà Ti Tú!', pid: 'Market Don Close!' },
    naira_symbol:   { en: '₦', yo: '₦', pid: '₦' },
    best_day:       { en: 'Best Day', yo: 'Ọjọ́ Tó Dára Jù', pid: 'Best Day' },
    earned:         { en: 'Earned Today', yo: 'Owó Oni', pid: 'Wage Today' },
    served_label:   { en: 'Customers Served', yo: 'A Tọ́nà Fún', pid: 'Serve People' },
    missed_label:   { en: 'Walked Away', yo: 'Wọ́n Kì', pid: 'Dem Walk Comot' },
    best_combo:     { en: 'Best Combo', yo: 'Ìṣọpọ̀ Tó Gajù', pid: 'Best Streak' },
    play_again:     { en: 'Play Again', yo: 'Tún Ṣe', pid: 'Run Am Again' },
    home:           { en: 'Home', yo: 'Ilé', pid: 'Home' },
    paused:         { en: 'Paused', yo: 'Dúró', pid: 'Hold Am' },
    new_best:       { en: 'NEW RECORD!', yo: 'ÀMÙÍTẸ́ tuntun!', pid: 'NEW RECORD!' },
    hearts:         { en: 'Reputation', yo: 'Ọ̀wọ̀', pid: 'Reputation' },
    combo:          { en: 'Combo', yo: 'Ìṣọpọ̀', pid: 'Combo' },
    order:          { en: 'Order', yo: 'Àṣẹ', pid: 'Wetin Dem Want' },
    reset:          { en: 'Reset Progress', yo: 'Paadà', pid: 'Wipe Progress' },
    reset_confirm:  { en: 'Erase your best day record?', yo: 'Pa àmùítẹ́ rẹ rẹ́?', pid: 'You wan wipe your record?' },
    reset_yes:      { en: 'Yes, erase', yo: 'Bẹ́ẹ̀ni', pid: 'Yes wipe am' },
    reset_no:       { en: 'Keep it', yo: 'Má ṣe', pid: 'No, keep am' },
    master:         { en: 'Master', yo: 'Gbogbo Ohùn', pid: 'All Sound' },
    music:          { en: 'Music', yo: 'Orin', pid: 'Music' },
    sfx:            { en: 'Effects', yo: 'Ariwo', pid: 'Noise' },
    language:       { en: 'Language', yo: 'Èdè', pid: 'Language' },
    haptics:        { en: 'Haptics', yo: 'Ìmọ̀lára', pid: 'Vibration' },
    on:             { en: 'ON', yo: 'BẸ̀', pid: 'ON' },
    off:            { en: 'OFF', yo: 'RÁ', pid: 'OFF' },
    tap_bins:       { en: 'Tap bins 1-6 (or keys 1-6) to bag goods.', yo: 'Fọ́n àpótí 1-6 láti kó ọjà.', pid: 'Tap bin 1-6 make you put goods for bag.' },
    tap_serve:      { en: 'Press SERVE when the bag matches the order.', yo: 'Tẹ GBÀ NÍGBÀ tí àpò bá mu àṣẹ.', pid: 'Press SERVE when bag match order.' },
    tap_patience:   { en: 'Customers lose patience — serve fast for bonus ₦!', yo: 'Oníbàárà máa parí iye — yára fún àfikún ₦!', pid: 'Customer go tire — yárá yárá make cash enter!' },
    tap_combo:      { en: 'Perfect orders build combos up to 3.5× pay!', yo: 'Ìṣẹ́ tó péye ń fún ọ ní 3.5×!', pid: 'Correct work dey give you 3.5× money!' },
    got_it:         { en: 'Got it!', yo: 'Mo gbọ́!', pid: 'I gather am!' },
    your_order:     { en: 'Your order', yo: 'Àṣẹ rẹ', pid: 'Wetin I want' },
    no_customer:    { en: 'Waiting for next customer...', yo: 'Ń dúró fún oníbàárà mìíràn...', pid: 'Dey wait next customer...' },
    combo_shout_1:  { en: 'Sharp vendor!', yo: 'Ọmọ ìyà!', pid: 'Sharp you!' },
    combo_shout_2:  { en: 'Ọpẹ́ o!', yo: 'Ọpẹ́ o!', pid: 'Na so!' },
    combo_shout_3:  { en: 'Oya na!', yo: 'Oya na!', pid: 'Oya na!' },
    error_wrong:    { en: 'Wrong order!', yo: 'Àṣẹ kò tọ̀nà!', pid: 'No be so!' },
    error_late:     { en: 'Customer walked away!', yo: 'Oníbàárà lọ!', pid: 'Customer don waka!' },
    share_hint:     { en: 'Screenshot this card to flex!', yo: 'Ya àwòrán yìí!', pid: 'Snap this one make you flex!' },
    customer:       { en: 'Customer', yo: 'Oníbàárà', pid: 'Customer' },
    their_offer:    { en: 'Their offer', yo: 'Iye wọn', pid: 'Wetin wọn fún' },
    share:          { en: 'Share', yo: 'Pín', pid: 'Share Am' },
    tap_distraction: { en: 'Tap the market chaos fast to clear it!', yo: 'Fọ́n ìrúkèrúdò ká tó parí!', pid: 'Tap the wahala sharp-sharp!' },
    tap_here:        { en: 'TAP HERE!', yo: 'FỌ́N NÍBÍ!', pid: 'TAP HERE!' },
    your_price:      { en: 'Your price', yo: 'Iye rẹ', pid: 'Your price' },
};

export const tr = (key: string, lang: Lang): string =>
    (T[key] && T[key][lang]) || (T[key] && T[key].en) || key;

// --- Persistence ---------------------------------------------------------------
const LS_SETTINGS = 'market_rush_settings_v1';
const LS_HIGH = 'market_rush_high_v1';

export function loadSettings(): Settings {
    try {
        const raw = localStorage.getItem(LS_SETTINGS);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
    try { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); } catch { /* ignore */ }
}

export function loadHighNaira(): number {
    try { return Number(localStorage.getItem(LS_HIGH)) || 0; } catch { return 0; }
}

export function saveHighNaira(v: number): void {
    try { localStorage.setItem(LS_HIGH, String(v)); } catch { /* ignore */ }
}

export function vibrate(pattern: number | number[], enabled: boolean): void {
    if (!enabled) return;
    try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    } catch { /* ignore */ }
}

// --- Procedural West-African rhythm synth (Web Audio API) ----------------------
// A tiny synthesizer that layers talking-drum, shaker and bass kora-style plucks
// under the cached BGM loops, plus arcade SFX accents. All nodes are created
// lazily on first user gesture to satisfy autoplay policies.

type SfxName = 'drum' | 'talk' | 'shaker' | 'coin' | 'chime' | 'thud' | 'buzz' | 'rain';

class AudioEngineImpl {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private loopTimer: number | null = null;
    private step = 0;
    private volumes = { master: 0.8, music: 0.55, sfx: 0.8 };
    private musicOn = false;

    private ensure(): boolean {
        if (this.ctx) return true;
        try {
            const AC: typeof AudioContext =
                window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (!AC) return false;
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.musicGain.connect(this.master);
            this.sfxGain.connect(this.master);
            this.master.connect(this.ctx.destination);
            this.applyVolumes();
            return true;
        } catch { this.ctx = null; return false; }
    }

    setVolumes(master: number, music: number, sfx: number): void {
        this.volumes = { master, music, sfx };
        this.applyVolumes();
    }

    private applyVolumes(): void {
        if (!this.ctx || !this.master || !this.musicGain || !this.sfxGain) return;
        this.master.gain.value = this.volumes.master;
        this.musicGain.gain.value = this.volumes.music * 0.5;
        this.sfxGain.gain.value = this.volumes.sfx * 0.7;
    }

    resume(): void {
        if (this.ensure() && this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => undefined);
        }
    }

    // --- one-shot synth voices ---
    private noiseBuffer(): AudioBuffer | null {
        if (!this.ctx) return null;
        const len = Math.floor(this.ctx.sampleRate * 0.4);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        return buf;
    }

    private voice(dest: GainNode | null, type: 'drum' | 'talk' | 'shaker' | 'coin' | 'chime' | 'thud' | 'buzz' | 'rain'): void {
        if (!this.ctx || !dest) return;
        const t = this.ctx.currentTime;
        const out = this.ctx.createGain();
        out.connect(dest);
        switch (type) {
            case 'drum': { // djembe low slap
                const o = this.ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(160, t);
                o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
                out.gain.setValueAtTime(0.9, t);
                out.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                o.connect(out); o.start(t); o.stop(t + 0.24);
                break;
            }
            case 'talk': { // talking-drum glide
                const o = this.ctx.createOscillator();
                o.type = 'triangle';
                o.frequency.setValueAtTime(220, t);
                o.frequency.linearRampToValueAtTime(420, t + 0.08);
                o.frequency.linearRampToValueAtTime(180, t + 0.2);
                out.gain.setValueAtTime(0.5, t);
                out.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
                o.connect(out); o.start(t); o.stop(t + 0.26);
                break;
            }
            case 'shaker': {
                const src = this.ctx.createBufferSource();
                const nb = this.noiseBuffer();
                if (!nb) return;
                src.buffer = nb;
                const hp = this.ctx.createBiquadFilter();
                hp.type = 'highpass'; hp.frequency.value = 5200;
                out.gain.setValueAtTime(0.28, t);
                out.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
                src.connect(hp); hp.connect(out);
                src.start(t); src.stop(t + 0.08);
                break;
            }
            case 'coin': {
                [1320, 1760].forEach((f, i) => {
                    const o = this.ctx!.createOscillator();
                    const g = this.ctx!.createGain();
                    o.type = 'square'; o.frequency.value = f;
                    g.gain.setValueAtTime(0.0001, t + i * 0.06);
                    g.gain.exponentialRampToValueAtTime(0.3, t + i * 0.06 + 0.01);
                    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.18);
                    o.connect(g); g.connect(out);
                    o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.2);
                });
                break;
            }
            case 'chime': { // major arpeggio fanfare
                [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                    const o = this.ctx!.createOscillator();
                    const g = this.ctx!.createGain();
                    o.type = 'sine'; o.frequency.value = f;
                    const st = t + i * 0.07;
                    g.gain.setValueAtTime(0.0001, st);
                    g.gain.exponentialRampToValueAtTime(0.26, st + 0.02);
                    g.gain.exponentialRampToValueAtTime(0.001, st + 0.5);
                    o.connect(g); g.connect(out);
                    o.start(st); o.stop(st + 0.55);
                });
                break;
            }
            case 'thud': {
                const o = this.ctx.createOscillator();
                o.type = 'sine';
                o.frequency.setValueAtTime(110, t);
                o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
                out.gain.setValueAtTime(0.7, t);
                out.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                o.connect(out); o.start(t); o.stop(t + 0.18);
                break;
            }
            case 'buzz': {
                const o = this.ctx.createOscillator();
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(140, t);
                o.frequency.linearRampToValueAtTime(90, t + 0.2);
                out.gain.setValueAtTime(0.22, t);
                out.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
                o.connect(out); o.start(t); o.stop(t + 0.26);
                break;
            }
            case 'rain': {
                const src = this.ctx.createBufferSource();
                const nb = this.noiseBuffer();
                if (!nb) return;
                src.buffer = nb; src.loop = true;
                const lp = this.ctx.createBiquadFilter();
                lp.type = 'lowpass'; lp.frequency.value = 1400;
                out.gain.setValueAtTime(0.0001, t);
                out.gain.linearRampToValueAtTime(0.25, t + 0.4);
                out.gain.linearRampToValueAtTime(0.0001, t + 3.2);
                src.connect(lp); lp.connect(out);
                src.start(t); src.stop(t + 3.3);
                break;
            }
        }
    }

    playSfx(name: SfxName): void {
        if (!this.ensure() || !this.ctx || !this.sfxGain) return;
        this.voice(this.sfxGain, name);
    }

    // --- looping 16-step West-African groove ---
    startMusic(intensity: 'calm' | 'rush' = 'calm'): void {
        if (!this.ensure() || !this.ctx) return;
        this.resume();
        if (this.musicOn) { this.setMusicIntensity(intensity); return; }
        this.musicOn = true;
        this.step = 0;
        const bpm = intensity === 'rush' ? 128 : 96;
        this.loopInterval = window.setInterval(() => this.tick(), (60 / bpm) * 1000 / 4);
        this.intensity = intensity;
    }

    private loopInterval: number | null = null;
    private intensity: 'calm' | 'rush' = 'calm';

    setMusicIntensity(intensity: 'calm' | 'rush'): void {
        if (this.intensity === intensity) return;
        this.intensity = intensity;
        if (this.loopInterval !== null) {
            window.clearInterval(this.loopInterval);
            const bpm = intensity === 'rush' ? 128 : 96;
            this.loopInterval = window.setInterval(() => this.tick(), (60 / bpm) * 1000 / 4);
        }
    }

    private tick(): void {
        if (!this.ctx || !this.musicGain) return;
        const s = this.step % 16;
        const rush = this.intensity === 'rush';
        // djembe pattern
        if (s === 0 || s === 6 || (rush && s === 10)) this.voice(this.musicGain, 'drum');
        if (s === 4 || s === 12) this.voice(this.musicGain, 'talk');
        // shekere on every off-8th
        if (s % 2 === 1) this.voice(this.musicGain, 'shaker');
        // kora-ish pluck
        if (s === 0 || s === 3 || s === 8 || s === 11) {
            const notes = [196, 233, 262, 294, 349];
            const f = notes[Math.floor(Math.random() * notes.length)];
            const t = this.ctx.currentTime;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'triangle'; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.14, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            o.connect(g); g.connect(this.musicGain);
            o.start(t); o.stop(t + 0.4);
        }
        this.step++;
    }

    stopMusic(): void {
        this.musicOn = false;
        if (this.loopInterval !== null) {
            window.clearInterval(this.loopInterval);
            this.loopInterval = null;
        }
    }
}

export const AudioEngine = new AudioEngineImpl();