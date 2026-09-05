import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EventBus, EV, StartGame, Game as GameScene } from './game/main';
import {
    AudioEngine, loadHighNaira, loadSettings, saveSettings, tr, vibrate,
    type DaySummary, type GamePhase, type HaggleData, type HudState, type Lang, type Settings,
} from './game/utils';

interface IRefPhaserGame { game: Phaser.Game | null; scene: Phaser.Scene | null; }

const emptyHud: HudState = {
    naira: 0, combo: 0, hearts: 5, phaseName: 'morning', customerCount: 0, totalCustomers: 15,
};

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [phase, setPhase] = useState<GamePhase>('BOOT');
    const [hud, setHud] = useState<HudState>(emptyHud);
    const [haggle, setHaggle] = useState<HaggleData | null>(null);
    const [summary, setSummary] = useState<DaySummary | null>(null);
    const [distraction, setDistraction] = useState<{ type: string; message: string } | null>(null);
    const [settings, setSettings] = useState<Settings>(() => loadSettings());
    const [highNaira, setHighNaira] = useState<number>(() => loadHighNaira());
    const [confirmReset, setConfirmReset] = useState(false);
    const [screen, setScreen] = useState<'menu' | 'settings' | 'howto'>('menu');

    // mount Phaser once
    useLayoutEffect(() => {
        if (phaserRef.current === null) {
            const game = StartGame('game-container');
            phaserRef.current = { game, scene: null };
        }
        const ready = (scene: Phaser.Scene) => { if (phaserRef.current) phaserRef.current.scene = scene; };
        EventBus.on(EV.SCENE_READY, ready);
        return () => {
            EventBus.removeListener(EV.SCENE_READY, ready);
            if (phaserRef.current) { phaserRef.current.game?.destroy(true); phaserRef.current = null; }
        };
    }, []);

    // EventBus subscriptions
    useEffect(() => {
        const onPhase = (p: GamePhase) => setPhase(p);
        const onHud = (h: HudState) => setHud(h);
        const onHaggle = (d: HaggleData) => setHaggle(d);
        const onSummary = (s: DaySummary) => { setSummary(s); setHighNaira(s.highNaira); };
        const onDistraction = (d: { type: string; message: string }) => setDistraction(d);
        const onDistractionCleared = () => setDistraction(null);
        EventBus.on(EV.PHASE, onPhase);
        EventBus.on(EV.HUD, onHud);
        EventBus.on(EV.HAGGLE, onHaggle);
        EventBus.on(EV.DAY_SUMMARY, onSummary);
        EventBus.on(EV.DISTRACTION, onDistraction);
        EventBus.on(EV.DISTRACTION_CLEARED, onDistractionCleared);
        return () => {
            EventBus.removeListener(EV.PHASE, onPhase);
            EventBus.removeListener(EV.HUD, onHud);
            EventBus.removeListener(EV.HAGGLE, onHaggle);
            EventBus.removeListener(EV.DAY_SUMMARY, onSummary);
            EventBus.removeListener(EV.DISTRACTION, onDistraction);
            EventBus.removeListener(EV.DISTRACTION_CLEARED, onDistractionCleared);
        };
    }, []);

    // push settings to scene + audio engine whenever they change
    useEffect(() => {
        saveSettings(settings);
        AudioEngine.setVolumes(settings.masterVol, settings.musicVol, settings.sfxVol);
        EventBus.emit(EV.SETTINGS, settings);
    }, [settings]);

    useEffect(() => { if (phase !== 'BOOT') return; const t = setTimeout(() => setPhase('MENU'), 400); return () => clearTimeout(t); }, [phase]);

    const t = (k: string) => tr(k, settings.language);
    const playing = phase === 'PLAYING' || phase === 'PAUSED';

    const openStall = () => { AudioEngine.resume(); vibrate(20, settings.haptics); setPhase('PLAYING'); EventBus.emit(EV.START); };
    const pause = () => EventBus.emit(EV.PAUSE);
    const resume = () => { setHaggle(null); EventBus.emit(EV.RESUME); };
    const choose = (c: 'accept' | 'counter' | 'firm') => { vibrate(15, settings.haptics); setHaggle(null); EventBus.emit(EV.HAGGLE_CHOICE, c); };
    const dismissDistraction = () => {
        if (!distraction) return;
        const scene = phaserRef.current?.scene as GameScene | null;
        if (scene && typeof scene.clearDistraction === 'function') scene.clearDistraction(distraction.type);
    };
    const playAgain = () => { setSummary(null); setHaggle(null); setPhase('PLAYING'); EventBus.emit(EV.RESTART); };
    const goHome = () => { setSummary(null); setHaggle(null); setPhase('MENU'); setScreen('menu'); EventBus.emit(EV.HOME); };
    const share = () => {
        const text = `I made ₦${summary?.earnedNaira ?? 0} at Market Rush (Ìyà Alátà)! 🧺🌶️`;
        if (typeof navigator !== 'undefined' && navigator.share) navigator.share({ text }).catch(() => undefined);
        else if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => undefined);
    };

    const heartRow = Array.from({ length: 5 }, (_, i) => i < hud.hearts);

    return (
        <div id="app">
            <div id="game-container"></div>

            <div id="hud">
                {/* ------- top HUD while playing ------- */}
                {playing && (
                    <div className="topbar">
                        <div className="topbar-row">
                            <div className="hearts" aria-label="Reputation">
                                {heartRow.map((full, i) => (
                                    <span key={i} className={full ? 'heart full' : 'heart'}>{full ? '❤️' : '🖤'}</span>
                                ))}
                            </div>
                            <div className="naira">₦{hud.naira.toLocaleString()}</div>
                            <button className="icon-btn" onClick={pause} aria-label="Pause">⏸</button>
                        </div>
                        <div className="topbar-row sub">
                            <span className="tier">{t(hud.phaseName)} · {t('customer')} {Math.min(hud.customerCount + 1, hud.totalCustomers)}/{hud.totalCustomers}</span>
                            {hud.combo > 1 && <span className="combo">🔥 x{hud.combo}</span>}
                        </div>
                    </div>
                )}

                {/* ------- distraction banner ------- */}
                {playing && distraction && (
                    <button className="distraction" onClick={dismissDistraction}>
                        <span>{distraction.message}</span>
                        <span className="distraction-tap">{t('tap_here')}</span>
                    </button>
                )}

                {/* ------- haggle modal ------- */}
                {haggle && (
                    <div className="modal-wrap">
                        <div className="modal haggle">
                            <h2>💬 {t('haggle_title')}</h2>
                            <p className="haggle-quote">“{t(haggle.textKey)}” — {haggle.customerName}</p>
                            <div className="haggle-prices">
                                <div><span className="muted">{t('your_price')}</span><b>₦{haggle.originalPrice}</b></div>
                                <div><span className="muted">{t('their_offer')}</span><b className="offer">₦{haggle.offeredPrice}</b></div>
                            </div>
                            <div className="btn-col">
                                <button className="btn" onClick={() => choose('accept')}>{t('haggle_accept')}</button>
                                <button className="btn" onClick={() => choose('counter')}>{t('haggle_counter')}</button>
                                <button className="btn btn-firm" onClick={() => choose('firm')}>{t('haggle_firm')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ------- pause overlay ------- */}
                {phase === 'PAUSED' && !haggle && (
                    <div className="modal-wrap">
                        <div className="modal">
                            <h2>⏸ {t('paused')}</h2>
                            <div className="btn-col">
                                <button className="btn btn-primary" onClick={resume}>{t('resume')}</button>
                                <button className="btn" onClick={playAgain}>{t('play_again')}</button>
                                <button className="btn" onClick={goHome}>{t('quit_menu')}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ------- game over / day summary ------- */}
                {phase === 'FINISHED' && summary && (
                    <div className="modal-wrap">
                        <div className="modal summary">
                            <h2>🌇 {t('day_complete')}</h2>
                            {summary.isNewBest && <div className="new-best">🏆 {t('new_best')}</div>}
                            <div className="big-naira">₦{summary.earnedNaira.toLocaleString()}</div>
                            <div className="stat-grid">
                                <div><b>{summary.served}</b><span>{t('served_label')}</span></div>
                                <div><b>{summary.missed}</b><span>{t('missed_label')}</span></div>
                                <div><b>x{summary.bestCombo}</b><span>{t('best_combo')}</span></div>
                                <div><b>₦{summary.highNaira.toLocaleString()}</b><span>{t('best_day')}</span></div>
                            </div>
                            <div className="btn-col">
                                <button className="btn btn-primary" onClick={playAgain}>🔄 {t('play_again')}</button>
                                <button className="btn" onClick={share}>📤 {t('share')}</button>
                                <button className="btn" onClick={goHome}>{t('home')}</button>
                            </div>
                            <p className="hint">{t('share_hint')}</p>
                        </div>
                    </div>
                )}

                {/* ------- home menu ------- */}
                {phase === 'MENU' && (
                    <div className="screen menu">
                        <div className="menu-inner">
                            <div className="logo">
                                <h1>MARKET RUSH</h1>
                                <div className="sub">Ìyà Alátà</div>
                            </div>
                            <p className="tagline">Serve the queue. Beat the haggle. Keep your reputation.</p>
                            <div className="best-day">🏆 {t('best_day')}: ₦{highNaira.toLocaleString()}</div>
                            <div className="btn-col">
                                <button className="btn btn-primary btn-big" onClick={openStall}>🧺 {t('play')}</button>
                                <button className="btn" onClick={() => setScreen('howto')}>📖 {t('how_to_play')}</button>
                                <button className="btn" onClick={() => setScreen('settings')}>⚙️ {t('settings')}</button>
                            </div>
                            <div className="footer">A West African market in one frantic afternoon.</div>
                        </div>
                    </div>
                )}

                {/* ------- how to play ------- */}
                {phase === 'MENU' && screen === 'howto' && (
                    <div className="screen">
                        <div className="modal howto">
                            <h2>📖 {t('how_to_play')}</h2>
                            <ul>
                                <li>🧺 {t('tap_bins')}</li>
                                <li>✅ {t('tap_serve')}</li>
                                <li>⏱️ {t('tap_patience')}</li>
                                <li>🔥 {t('tap_combo')}</li>
                                <li>🐔 {t('tap_distraction')}</li>
                            </ul>
                            <button className="btn btn-primary" onClick={() => setScreen('menu')}>{t('got_it')}</button>
                        </div>
                    </div>
                )}

                {/* ------- settings ------- */}
                {phase === 'MENU' && screen === 'settings' && (
                    <div className="screen">
                        <div className="modal settings">
                            <h2>⚙️ {t('settings')}</h2>
                            {(['masterVol', 'musicVol', 'sfxVol'] as const).map(key => (
                                <label className="slider-row" key={key}>
                                    <span>{t(key === 'masterVol' ? 'master' : key === 'musicVol' ? 'music' : 'sfx')}</span>
                                    <input type="range" min={0} max={1} step={0.05} value={settings[key]}
                                        onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))} />
                                    <b>{Math.round(settings[key] * 100)}</b>
                                </label>
                            ))}
                            <div className="lang-row">
                                <span>{t('language')}</span>
                                <div className="lang-btns">
                                    {(['en', 'yo', 'pid'] as Lang[]).map(l => (
                                        <button key={l} className={settings.language === l ? 'lang active' : 'lang'}
                                            onClick={() => setSettings(s => ({ ...s, language: l }))}>
                                            {l === 'en' ? 'EN' : l === 'yo' ? 'YORÙBÁ' : 'PIDGIN'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <label className="toggle-row">
                                <span>{t('haptics')}</span>
                                <button className={settings.haptics ? 'toggle on' : 'toggle'}
                                    onClick={() => setSettings(s => ({ ...s, haptics: !s.haptics }))}>
                                    {settings.haptics ? t('on') : t('off')}
                                </button>
                            </label>
                            {!confirmReset ? (
                                <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>🗑 {t('reset')}</button>
                            ) : (
                                <div className="reset-confirm">
                                    <p>{t('reset_confirm')}</p>
                                    <div className="row">
                                        <button className="btn btn-danger" onClick={() => {
                                            localStorage.removeItem('market_rush_high_v1');
                                            setHighNaira(0); setConfirmReset(false);
                                        }}>{t('reset_yes')}</button>
                                        <button className="btn" onClick={() => setConfirmReset(false)}>{t('reset_no')}</button>
                                    </div>
                                </div>
                            )}
                            <button className="btn btn-primary" onClick={() => setScreen('menu')}>← {t('back')}</button>
                        </div>
                    </div>
                )}

                {phase === 'BOOT' && (
                    <div className="screen boot"><div className="loading">Loading market…</div></div>
                )}
            </div>
        </div>
    );
}

export default App;