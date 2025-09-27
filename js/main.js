/**
 * WebOsz - Browser-based osu!mania rhythm game
 * 
 * main.js - Core game logic for WebOsz
 * Handles beatmap loading, game mechanics, scoring, and UI interactions
 */

// DOM Elements
    const oszFileInput = document.getElementById('oszFileInput');
    const startScreenFileName = document.getElementById('startScreenFileName');
    const startButton = document.getElementById('startButton');
    const scrollSpeedInput = document.getElementById('scrollSpeedInput');
    const scrollSpeedValueDisplay = document.getElementById('scrollSpeedValue');
    const mapRateInput = document.getElementById('mapRateInput');
    const mapRateValueDisplay = document.getElementById('mapRateValue');
    const preservePitchToggle = document.getElementById('preservePitchToggle');

    const startScreen = document.getElementById('startScreen');
    const gameContainer = document.getElementById('gameContainer');
    const menuScreen = document.getElementById('menuScreen');
    const mapTitle = document.getElementById('mapTitle');
    const difficultyListContainer = document.getElementById('difficultyListContainer');
    const keybindsButton = document.getElementById('keybindsButton');
    const keybindsOverlay = document.getElementById('keybindsOverlay');
    const closeKeybindsOverlayButton = document.getElementById('closeKeybindsOverlay');
    const mapBackgroundOverlay = document.getElementById('mapBackgroundOverlay');

    const backToStartButton = document.getElementById('backToStartButton');
    const customizeButton = document.getElementById('customizeButton');
    const customizeOverlay = document.getElementById('customizeOverlay');
    const closeCustomizeOverlayButton = document.getElementById('closeCustomizeOverlay');
    const accentColorInput = document.getElementById('accentColorInput');
    const noteColor1Input = document.getElementById('noteColor1Input');
    const noteColor2Input = document.getElementById('noteColor2Input');
    const noteColor3Input = document.getElementById('noteColor3Input');
    const noteColor4Input = document.getElementById('noteColor4Input');

    const gameScreen = document.getElementById('gameScreen');
    const resultsScreen = document.getElementById('resultsScreen');
    const retryButton = document.getElementById('retryButton');
    const backToMenuButton = document.getElementById('backToMenuButton');
    const backButton = document.getElementById('backButton');
    const comboDisplay = document.getElementById('combo');
    const finalScoreDisplay = document.getElementById('finalScore');
    const maxComboDisplay = document.getElementById('maxCombo');
    const accuracyDisplay = document.getElementById('accuracyDisplay');
    const liveAccuracyDisplay = document.getElementById('liveAccuracyDisplay');
    const gameAudio = document.getElementById('gameAudio');
    const lanes = [
        document.getElementById('note-column-0'),
        document.getElementById('note-column-1'),
        document.getElementById('note-column-2'),
        document.getElementById('note-column-3')
    ];
    const keyButtons = [
        document.getElementById('key-0'),
        document.getElementById('key-1'),
        document.getElementById('key-2'),
        document.getElementById('key-3')
    ];
    const gameArea = document.querySelector('.game-area');

    const rankDisplay = document.getElementById('rankDisplay');
    const countMaxDisplay = document.getElementById('countMaxDisplay');
    const count300Display = document.getElementById('count300Display');
    const count100Display = document.getElementById('count100Display');
    const count50Display = document.getElementById('count50Display');
    const countMissDisplay = document.getElementById('countMissDisplay');
    const songProgressBarFill = document.getElementById('songProgressBarFill');

    const keybindGrid = document.getElementById('keybindGrid');

    // Map Search Elements
    const searchMapsButton = document.getElementById('searchMapsButton');
    const mapSearchOverlay = document.getElementById('mapSearchOverlay');
    const closeSearchOverlay = document.getElementById('closeSearchOverlay');
    const mapSearchInput = document.getElementById('mapSearchInput');
    const executeSearchButton = document.getElementById('executeSearchButton');
    const statusFilter = document.getElementById('statusFilter');
    const searchResults = document.getElementById('searchResults');
    const searchLoading = document.getElementById('searchLoading');

    // Game State
    let currentBeatmap = null;
    let availableBeatmaps = [];
    let audioFilesMap = new Map();
    let imageFilesMap = new Map();
    let notes = [];
    let activeNotes = [];
    let score = 0;
    let combo = 0;
    let maxCombo = 0;
    let countMax = 0;
    let count300 = 0;
    let count200 = 0;
    let count100 = 0;
    let count50 = 0;
    let countMiss = 0;

    let gameStartTime = 0;
    let animationFrameId = null;
    let isPlaying = false;
    let audioLeadIn = 0;
    let currentScrollSpeed = parseFloat(localStorage.getItem('scrollSpeed') || 20);
    let currentMapRate = parseFloat(localStorage.getItem('mapRate') || mapRateInput.value);

    // Keybind State
    const DEFAULT_LANE_KEYS = ['D', 'F', 'J', 'K'];
    let LANE_KEYS = [...DEFAULT_LANE_KEYS];
    let changingKeybindIndex = -1;

    // Game Constants
    const PLAYFIELD_SCALE = 1.3;
    const BASE_FALL_SPEED_PX_PER_MS = 0.05; // Halbiert, um mit osu!mania-Scrollspeed kompatibel zu sein
    const GAME_AREA_HEIGHT = 600 * PLAYFIELD_SCALE;
    const RECEPTOR_HEIGHT = 70 * PLAYFIELD_SCALE;
    const JUDGMENT_OFFSET_FROM_RECEPTOR_BOTTOM = 70 * PLAYFIELD_SCALE; // Angepasst an die neue --judgment-offset Variable

    let od = 8; 

    // OD8 osu!mania timing windows
    const HIT_WINDOW_MAX_MS = 16;    // Perfect/MAX (±16ms)
    const HIT_WINDOW_300_MS = 34;    // Great/300 (±34ms) 
    const HIT_WINDOW_100_MS = 67;    // Good/100 (±67ms)
    const HIT_WINDOW_50_MS = 97;     // Bad/50 (±97ms)
    // Miss is anything beyond ±97ms

    // --- Animation Helpers ---
    function showOverlay(overlay) {
        if (!overlay) return;
        overlay.classList.remove('hidden');
        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });
    }

    function hideOverlay(overlay) {
        if (!overlay || overlay.classList.contains('hidden')) return;
        overlay.classList.remove('visible');
        const onTransitionEnd = () => {
            overlay.classList.add('hidden');
            overlay.removeEventListener('transitionend', onTransitionEnd);
        };
        overlay.addEventListener('transitionend', onTransitionEnd);
    }

    // --- Screen Management ---
    function showScreen(screenName) {
        const screensToHide = [startScreen, menuScreen, gameScreen, resultsScreen];
        let screenToShow;

        // Hide all screens instantly
        screensToHide.forEach(s => s.classList.add('hidden'));
        gameContainer.classList.add('hidden');

        // Determine which screen to show
        if (screenName === 'start') {
            screenToShow = startScreen;
            screenToShow.classList.remove('hidden');
        } else {
            gameContainer.classList.remove('hidden');
            if (screenName === 'menu') screenToShow = menuScreen;
            if (screenName === 'game') screenToShow = gameScreen;
            if (screenName === 'results') screenToShow = resultsScreen;
            if (screenToShow) screenToShow.classList.remove('hidden');
        }

        // Animate the new screen in
        if (screenToShow) {
            screenToShow.classList.add('anim-fade-in');
            screenToShow.addEventListener('animationend', () => {
                screenToShow.classList.remove('anim-fade-in');
            }, { once: true });
        }
        
        // Hide overlays with animation
        hideOverlay(keybindsOverlay);
        hideOverlay(customizeOverlay);
    }


    // --- Utility Functions ---

    function loadKeybinds() {
        const savedKeybinds = localStorage.getItem('rhythmFlowKeybinds');
        if (savedKeybinds) {
            LANE_KEYS = JSON.parse(savedKeybinds);
        } else {
            LANE_KEYS = [...DEFAULT_LANE_KEYS];
        }
        updateKeybindsUI();
    }

    function saveKeybinds() {
        localStorage.setItem('rhythmFlowKeybinds', JSON.stringify(LANE_KEYS));
    }

    function updateKeybindsUI() {
        keybindGrid.innerHTML = '';
        LANE_KEYS.forEach((key, index) => {
            const keybindItem = document.createElement('div');
            keybindItem.classList.add('keybind-item');
            keybindItem.innerHTML = `
                <span class="keybind-label">Note ${index + 1}:</span>
                <button class="keybind-button" data-index="${index}">${key}</button>
            `;
            keybindGrid.appendChild(keybindItem);
        });

        document.querySelectorAll('.keybind-button').forEach(button => {
            button.addEventListener('click', (event) => {
                changingKeybindIndex = parseInt(event.target.dataset.index, 10);
                event.target.textContent = 'Press a key...';
                event.target.classList.add('listening');
                document.addEventListener('keydown', handleKeybindChange, { once: true });
            });
        });
    }

    function handleKeybindChange(event) {
        event.preventDefault();
        const newKey = event.key.toUpperCase();
        const button = document.querySelector(`.keybind-button[data-index="${changingKeybindIndex}"]`);

        if (newKey && newKey.length === 1 && /^[A-Z0-9]$/.test(newKey)) {
            LANE_KEYS[changingKeybindIndex] = newKey;
            saveKeybinds();
            updateKeybindsUI();
        } else {
            if (button) {
                button.textContent = LANE_KEYS[changingKeybindIndex];
            }
            alert('Please press a single alphanumeric key (A-Z, 0-9).');
        }
        
        if (button) {
            button.classList.remove('listening');
        }
        changingKeybindIndex = -1;
    }

    function loadCustomColors() {
        // Customize-Funktionalität wurde entfernt
        if (noteColor3Input && note3) noteColor3Input.value = note3;
        if (noteColor4Input && note4) noteColor4Input.value = note4;
    }

    function saveCustomColor(cssVar, value) {
        localStorage.setItem(`custom${cssVar.replace('--', '').replace(/-/g, '')}`, value);
        document.documentElement.style.setProperty(cssVar, value);
    }


    // --- Event Listeners ---

    oszFileInput.addEventListener('change', async (event) => {
        console.log('OSZ file input change detected.');
        const file = event.target.files[0];
        if (file) {
            startScreenFileName.textContent = 'Loading...';
            try {
                await loadOszFile(file);
                
                showScreen('menu');

                mapTitle.textContent = currentBeatmap ? currentBeatmap.metadata.Title || 'Unknown Title' : 'Select a Difficulty';
                updateScrollSpeedDisplay(); 
                updateMapRateDisplay();
            } catch (error) {
                console.error('Error loading OSZ file:', error);
                alert('Failed to load beatmap. Please ensure it is a valid .osz file and contains .osu and audio files.');
                startScreenFileName.textContent = 'Load Beatmap';
                startButton.disabled = true;
                currentBeatmap = null;
                availableBeatmaps = [];
                audioFilesMap.clear();
                imageFilesMap.clear();
            }
        } else {
            startScreenFileName.textContent = 'Load Beatmap';
            startButton.disabled = true;
            currentBeatmap = null;
            availableBeatmaps = [];
            audioFilesMap.clear();
            imageFilesMap.clear();
        }
    });

    difficultyListContainer.addEventListener('click', async (event) => {
        console.log('Difficulty item clicked.');
        const difficultyItem = event.target.closest('.difficulty-item');
        if (difficultyItem) {
            const selectedIndex = parseInt(difficultyItem.dataset.index, 10);
            if (availableBeatmaps[selectedIndex]) {
                document.querySelectorAll('.difficulty-item').forEach(item => item.classList.remove('active'));
                difficultyItem.classList.add('active');

                currentBeatmap = availableBeatmaps[selectedIndex].data;
                const audioFilename = currentBeatmap.general.AudioFilename;
                const backgroundFilename = currentBeatmap.events.find(e => e.startsWith('0,0,"') && e.endsWith('",0,0'))?.split(',')[2].replace(/"/g, '');

                if (audioFilename && audioFilesMap.has(audioFilename)) {
                    console.log(`Attempting to load audio for preview: ${audioFilename}`);
                    try {
                        // Stop any previously playing preview audio
                        if (gameAudio.src) {
                            gameAudio.pause();
                            // It's good practice to revoke the old object URL to free up memory
                            if (gameAudio.src.startsWith('blob:')) {
                                URL.revokeObjectURL(gameAudio.src);
                            }
                        }

                        const audioBlob = await audioFilesMap.get(audioFilename).async('blob');
                        gameAudio.src = URL.createObjectURL(audioBlob);
                        gameAudio.playbackRate = currentMapRate;
                        gameAudio.preservesPitch = !preservePitchToggle.checked;
                        
                        // Play a preview of the song
                        const previewTime = parseInt(currentBeatmap.general.PreviewTime, 10);
                        gameAudio.currentTime = (previewTime && previewTime > 0) ? previewTime / 1000 : 0;

                        const playPromise = gameAudio.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                // Don't show an alert for preview failing, just log it.
                                console.warn("Audio preview failed to play:", error);
                            });
                        }

                        console.log('Audio source set and preview started.');
                        startButton.disabled = false;
                    } catch (audioError) {
                        console.error('Error loading audio blob:', audioError);
                        alert(`Failed to load audio for "${audioFilename}".`);
                        startButton.disabled = true;
                        gameAudio.pause();
                        gameAudio.src = '';
                    }
                } else {
                    console.warn(`Audio file "${audioFilename}" not found for selected beatmap.`);
                    alert(`Audio file "${audioFilename}" not found in the .osz archive for this difficulty.`);
                    startButton.disabled = true;
                    gameAudio.pause();
                    gameAudio.src = '';
                }

                if (backgroundFilename && imageFilesMap.has(backgroundFilename)) {
                    console.log(`Attempting to load background: ${backgroundFilename}`);
                    try {
                        const imageBlob = await imageFilesMap.get(backgroundFilename).async('blob');
                        mapBackgroundOverlay.style.backgroundImage = `url(${URL.createObjectURL(imageBlob)})`;
                        console.log('Background image set successfully.');
                    } catch (imageError) {
                        console.error('Error loading image blob:', imageError);
                        mapBackgroundOverlay.style.backgroundImage = 'none';
                    }
                } else {
                    mapBackgroundOverlay.style.backgroundImage = 'none';
                    console.warn(`Background file "${backgroundFilename}" not found.`);
                }
            }
        }
    });


    scrollSpeedInput.addEventListener('input', () => {
        // Scrollspeed als Ganzzahl verwenden, wie in osu!mania
        currentScrollSpeed = parseInt(scrollSpeedInput.value, 10);
        localStorage.setItem('scrollSpeed', currentScrollSpeed);
        updateScrollSpeedDisplay();
    });

    scrollSpeedValueDisplay.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1'; // Nur ganzzahlige Schritte erlauben
        input.min = scrollSpeedInput.min;
        input.max = scrollSpeedInput.max;
        input.value = Math.round(currentScrollSpeed); // Auf ganze Zahl runden
        input.classList.add('navbar-value-input');

        scrollSpeedValueDisplay.replaceWith(input);
        input.focus();

        const handleInputEnd = () => {
            let newValue = parseInt(input.value, 10);
            if (isNaN(newValue) || newValue < parseInt(scrollSpeedInput.min, 10) || newValue > parseInt(scrollSpeedInput.max, 10)) {
                newValue = parseInt(scrollSpeedInput.value, 10);
            }
            currentScrollSpeed = newValue;
            scrollSpeedInput.value = newValue;
            localStorage.setItem('scrollSpeed', currentScrollSpeed);
            input.replaceWith(scrollSpeedValueDisplay);
            updateScrollSpeedDisplay();
        };

        input.addEventListener('blur', handleInputEnd);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    });

    mapRateValueDisplay.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.05';
        input.min = mapRateInput.min;
        input.max = mapRateInput.max;
        input.value = currentMapRate;
        input.classList.add('navbar-value-input');

        mapRateValueDisplay.replaceWith(input);
        input.focus();

        const handleInputEnd = () => {
            let newValue = parseFloat(input.value);
            if (isNaN(newValue) || newValue < parseFloat(mapRateInput.min) || newValue > parseFloat(mapRateInput.max)) {
                newValue = parseFloat(mapRateInput.value);
            }
            currentMapRate = newValue;
            mapRateInput.value = newValue;
            localStorage.setItem('mapRate', currentMapRate);
            gameAudio.playbackRate = currentMapRate;
            gameAudio.preservesPitch = !preservePitchToggle.checked;
            input.replaceWith(mapRateValueDisplay);
            updateMapRateDisplay();
        };

        input.addEventListener('blur', handleInputEnd);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    });


    mapRateInput.addEventListener('input', () => {
        currentMapRate = parseFloat(mapRateInput.value);
        localStorage.setItem('mapRate', currentMapRate);
        gameAudio.playbackRate = currentMapRate;
        gameAudio.preservesPitch = !preservePitchToggle.checked;
        updateMapRateDisplay();
    });

    preservePitchToggle.addEventListener('change', () => {
        gameAudio.preservesPitch = !preservePitchToggle.checked;
    });

    startButton.addEventListener('click', () => {
        console.log('Play button clicked.');
        if (currentBeatmap && gameAudio.src) {
            startGame();
        } else {
            console.warn('Cannot start game: currentBeatmap or gameAudio.src is missing.');
            alert('Please select a beatmap difficulty and ensure audio is loaded before playing.');
        }
    });

    keybindsButton.addEventListener('click', () => {
        showOverlay(keybindsOverlay);
    });

    closeKeybindsOverlayButton.addEventListener('click', () => {
        hideOverlay(keybindsOverlay);
    });



    // Map Search Event Listeners
    searchMapsButton.addEventListener('click', () => {
        showOverlay(mapSearchOverlay);
    });

    closeSearchOverlay.addEventListener('click', () => {
        // Stop any playing preview
        if (currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio.src = '';
            currentPreviewAudio = null;
            currentPreviewButton = null;
        }
        hideOverlay(mapSearchOverlay);
    });

    executeSearchButton.addEventListener('click', () => {
        searchMaps();
    });

    mapSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchMaps();
        }
    });


    retryButton.addEventListener('click', () => {
        if (currentBeatmap && gameAudio.src) {
            startGame();
        } else {
            resetGame();
            showScreen('menu');
        }
    });

    backToMenuButton.addEventListener('click', () => {
        resetGame();
        showScreen('menu');
    });

    backButton.addEventListener('click', () => {
        resetGame();
        showScreen('menu');
    });

    backToStartButton.addEventListener('click', () => {
        resetGame();
        showScreen('start');

        startButton.disabled = true;
        currentBeatmap = null;
        gameAudio.src = '';
        startScreenFileName.textContent = 'Load Beatmap';
        difficultyListContainer.innerHTML = '';
        availableBeatmaps = [];
        audioFilesMap.clear();
        imageFilesMap.clear();
    });


    document.addEventListener('keydown', (event) => {
        if (!isPlaying) return;

        const key = event.key.toUpperCase();
        const laneIndex = LANE_KEYS.indexOf(key);

        if (laneIndex !== -1) {
            keyButtons[laneIndex].classList.add('active');
            handleKeyPress(laneIndex);
        }
    });

    document.addEventListener('keyup', (event) => {
        const key = event.key.toUpperCase();
        const laneIndex = LANE_KEYS.indexOf(key);
        if (laneIndex !== -1 && keyButtons[laneIndex]) {
            keyButtons[laneIndex].classList.remove('active');
        }
    });

    // --- Game Logic ---

    async function loadOszFile(file) {
        console.log('Starting loadOszFile for:', file.name);
        const zip = new JSZip();
        const content = await zip.loadAsync(file);
        console.log('ZIP content loaded.');

        availableBeatmaps = [];
        audioFilesMap.clear();
        imageFilesMap.clear();
        difficultyListContainer.innerHTML = '';
        startButton.disabled = true;
        gameAudio.pause();
        gameAudio.src = '';

        const osuFileEntries = [];

        content.forEach((relativePath, zipEntry) => {
            if (relativePath.endsWith('.osu')) {
                osuFileEntries.push(zipEntry);
            } else if (/\.(mp3|ogg|wav)$/i.test(relativePath)) {
                audioFilesMap.set(relativePath, zipEntry);
            } else if (/\.(jpg|jpeg|png|gif)$/i.test(relativePath)) {
                imageFilesMap.set(relativePath, zipEntry);
            }
        });
        console.log(`Found ${osuFileEntries.length} .osu files, ${audioFilesMap.size} audio files, ${imageFilesMap.size} image files.`);

        if (osuFileEntries.length === 0) {
            throw new Error('No .osu beatmap files found in the archive.');
        }
        if (audioFilesMap.size === 0) {
            throw new Error('No audio files found in the archive.');
        }

        for (const osuEntry of osuFileEntries) {
            const osuText = await osuEntry.async('text');
            const parsed = parseOsuFile(osuText);
            const difficultyName = parsed.metadata.Version || osuEntry.name.split('[').pop().split('].osu')[0] || 'Unknown Difficulty';
            
            if (parsed.general.AudioFilename && audioFilesMap.has(parsed.general.AudioFilename)) {
                availableBeatmaps.push({
                    name: difficultyName,
                    data: parsed,
                    osuFileName: osuEntry.name
                });
                console.log(`Added beatmap: ${difficultyName} with audio: ${parsed.general.AudioFilename}`);
            } else {
                console.warn(`Beatmap "${difficultyName}" references missing audio file: "${parsed.general.AudioFilename}". Skipping this beatmap.`);
            }
        }

        if (availableBeatmaps.length === 0) {
            console.warn('No beatmaps found, but continuing anyway...');
            // Don't throw error, just continue with empty beatmap list
        }

        availableBeatmaps.sort((a, b) => {
            const odA = parseFloat(a.data.difficulty.OverallDifficulty || '0');
            const odB = parseFloat(b.data.difficulty.OverallDifficulty || '0');
            if (odA !== odB) return odA - odB;
            return a.name.localeCompare(b.name);
        });

        availableBeatmaps.forEach((bm, index) => {
            const difficultyItem = document.createElement('div');
            difficultyItem.classList.add('difficulty-item');
            difficultyItem.dataset.index = index;
            difficultyItem.textContent = bm.name;
            difficultyListContainer.appendChild(difficultyItem);
        });

        if (availableBeatmaps.length > 0) {
            console.log('Selecting first available beatmap difficulty.');
            difficultyListContainer.querySelector('.difficulty-item').click();
        }

        console.log('Beatmaps loaded:', availableBeatmaps);
        console.log('Available audio files:', Array.from(audioFilesMap.keys()));
        console.log('Available image files:', Array.from(imageFilesMap.keys()));
    }

    function parseOsuFile(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const parsed = {
            general: {},
            metadata: {},
            difficulty: {},
            timingPoints: [],
            hitObjects: [],
            events: []
        };
        let currentSection = '';

        for (const line of lines) {
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.substring(1, line.length - 1);
                continue;
            }

            if (currentSection === 'General' || currentSection === 'Metadata' || currentSection === 'Difficulty') {
                const parts = line.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();
                    parsed[currentSection.toLowerCase()][key] = value;
                }
            } else if (currentSection === 'TimingPoints') {
                const parts = line.split(',');
                if (parts.length >= 8) {
                    parsed.timingPoints.push({
                        time: parseInt(parts[0], 10),
                        beatLength: parseFloat(parts[1]),
                        uninherited: parseInt(parts[6], 10)
                    });
                }
            } else if (currentSection === 'HitObjects') {
                const parts = line.split(',');
                if (parts.length >= 5) {
                    const x = parseInt(parts[0], 10);
                    const time = parseInt(parts[2], 10);
                    const type = parseInt(parts[3], 10);

                    let lane = -1;
                    if (x >= 0 && x <= 128) lane = 0;
                    else if (x > 128 && x <= 256) lane = 1;
                    else if (x > 256 && x <= 384) lane = 2;
                    else if (x > 384 && x <= 512) lane = 3;

                    if (lane !== -1) {
                        parsed.hitObjects.push({
                            time: time,
                            lane: lane,
                            isLongNote: (type & 128) !== 0,
                            endTime: (type & 128) !== 0 ? parseInt(parts[5].split(':')[0], 10) : time
                        });
                    }
                }
            } else if (currentSection === 'Events') {
                parsed.events.push(line);
            }
        }
        
        parsed.hitObjects.sort((a, b) => a.time - b.time);
        parsed.bpm = 0;
        
        // Debug logging
        console.log('Parsed osu file sections:', {
            general: parsed.general,
            metadata: parsed.metadata,
            difficulty: parsed.difficulty,
            hitObjectsCount: parsed.hitObjects.length
        });
        
        return parsed;
    }

    function updateScrollSpeedDisplay() {
        // Scrollspeed als Ganzzahl anzeigen, wie in osu!mania
        scrollSpeedValueDisplay.textContent = `${Math.round(currentScrollSpeed)}`;
    }

    function updateMapRateDisplay() {
        mapRateValueDisplay.textContent = `${currentMapRate.toFixed(2)}x`;
    }

    function startGame() {
        console.log('Starting game...');
        if (!currentBeatmap) {
            alert('Please select a beatmap difficulty first!');
            return;
        }
        if (!gameAudio.src) {
            alert('Audio not loaded for the selected beatmap. Please select a different difficulty or re-load the .osz file.');
            return;
        }

        showScreen('game');
        
        // Set game background from map background
        const backgroundFilename = currentBeatmap.events.find(e => e.startsWith('0,0,"') && e.endsWith('",0,0'))?.split(',')[2].replace(/"/g, '');
        if (backgroundFilename && imageFilesMap.has(backgroundFilename)) {
            try {
                imageFilesMap.get(backgroundFilename).async('blob').then(imageBlob => {
                    gameBackground.style.backgroundImage = `url(${URL.createObjectURL(imageBlob)})`;
                });
            } catch (error) {
                console.error('Error setting game background:', error);
                gameBackground.style.backgroundImage = 'none';
            }
        }

        resetGame();

        notes = currentBeatmap.hitObjects.map(note => ({
            ...note,
            element: null,
            hit: false,
            missed: false
        }));

        audioLeadIn = parseInt(currentBeatmap.general.AudioLeadIn || '0', 10);

        gameAudio.currentTime = 0;
        gameAudio.playbackRate = currentMapRate;
        gameAudio.preservesPitch = !preservePitchToggle.checked;
        
        // Attempt to play audio, handle potential errors (e.g., autoplay policy)
        const playPromise = gameAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Audio playback started successfully.');
                gameStartTime = performance.now();
                isPlaying = true;
                animationFrameId = requestAnimationFrame(gameLoop);
            }).catch(error => {
                console.error('Audio playback failed:', error);
                alert('Failed to play audio. Please ensure your browser allows autoplay or interact with the page first.');
                resetGame();
                showScreen('menu');
            });
        } else {
            // Fallback for browsers that don't return a Promise (less common now)
            console.log('Audio playback initiated (no promise returned).');
            gameStartTime = performance.now();
            isPlaying = true;
            animationFrameId = requestAnimationFrame(gameLoop);
        }
    }

    function resetGame() {
        console.log('Resetting game state.');
        score = 0;
        combo = 0;
        maxCombo = 0;
        countMax = 0;
        count300 = 0;
        count200 = 0;
        count100 = 0;
        count50 = 0;
        countMiss = 0;

        comboDisplay.textContent = combo;
        accuracyDisplay.textContent = '0.00%';
        liveAccuracyDisplay.textContent = '0.00%';
        rankDisplay.textContent = 'D';
        songProgressBarFill.style.width = '0%';

        activeNotes = [];
        gameAudio.pause();
        gameAudio.currentTime = 0;
        cancelAnimationFrame(animationFrameId);
        isPlaying = false;

        lanes.forEach(lane => {
            while (lane.firstChild) {
                lane.removeChild(lane.firstChild);
            }
        });
        document.querySelectorAll('.judgment-text').forEach(el => el.remove());
        
        // UR-Bar zurücksetzen
        const urBar = document.getElementById('urBar');
        if (urBar) {
            while (urBar.firstChild) {
                urBar.removeChild(urBar.firstChild);
            }
        }
    }

    function gameLoop(currentTime) {
        if (!isPlaying) return;

        const audioTime = gameAudio.currentTime * 1000;
        // Konstante Scrollgeschwindigkeit unabhängig von der Map-Rate
        const effectiveNoteFallSpeed = BASE_FALL_SPEED_PX_PER_MS * currentScrollSpeed;

        if (gameAudio.duration) {
            const progress = (gameAudio.currentTime / gameAudio.duration) * 100;
            songProgressBarFill.style.width = `${progress}%`;
        }

        // AudioLeadIn muss mit der Map-Rate angepasst werden, aber die Scroll-Geschwindigkeit bleibt unverändert
        if (audioLeadIn > 0 && audioTime < (audioLeadIn / currentMapRate) && gameAudio.readyState >= 2) {
            gameAudio.currentTime = (audioLeadIn / currentMapRate) / 1000;
            console.log(`Skipping audio to ${audioLeadIn}ms (effective ${audioLeadIn / currentMapRate}ms)`);
            audioLeadIn = 0;
        }

        while (notes.length > 0 && notes[0].time <= audioTime + ((GAME_AREA_HEIGHT - JUDGMENT_OFFSET_FROM_RECEPTOR_BOTTOM) / effectiveNoteFallSpeed) + 100) {
            const noteData = notes.shift();
            const noteElement = document.createElement('div');
            noteElement.classList.add('note', `note-column-${noteData.lane}`);
            noteElement.dataset.time = noteData.time;
            noteElement.dataset.lane = noteData.lane;
            noteData.element = noteElement;
            lanes[noteData.lane].appendChild(noteElement);
            activeNotes.push(noteData);
        }

        for (let i = activeNotes.length - 1; i >= 0; i--) {
            const note = activeNotes[i];

            const distanceInMs = note.time - audioTime;
            const pixelDistance = distanceInMs * effectiveNoteFallSpeed;
            note.element.style.bottom = `${pixelDistance + JUDGMENT_OFFSET_FROM_RECEPTOR_BOTTOM}px`;

            if (!note.hit && !note.missed && audioTime > note.time + HIT_WINDOW_50_MS) {
                note.missed = true;
                note.element.classList.add('hit-or-missed');
                resetCombo();
                countMiss++;
                displayJudgment('MISS', 'judgment-miss');
                updateLiveAccuracyDisplay();
                // console.log('Note missed due to time out!'); // Removed for less console spam
            }

            if (pixelDistance + JUDGMENT_OFFSET_FROM_RECEPTOR_BOTTOM < -note.element.offsetHeight) {
                if (note.element && note.element.parentNode) {
                    note.element.remove();
                }
                activeNotes.splice(i, 1);
            }
        }

        // Check for game end condition
        const lastNoteTime = currentBeatmap.hitObjects.length > 0 ? currentBeatmap.hitObjects[currentBeatmap.hitObjects.length - 1].time : 0;
        
        // Robustly get audio duration. isFinite handles NaN, Infinity, -Infinity.
        const audioDurationMs = (gameAudio.duration && isFinite(gameAudio.duration)) ? gameAudio.duration * 1000 : 0;

        // If duration is available, end 1.5s after the last note or when audio ends, whichever is later.
        // If not, end 3s after the last note as a fallback.
        const gameEndTimeThreshold = audioDurationMs > 0 
            ? Math.max(lastNoteTime + 1500, audioDurationMs)
            : lastNoteTime + 3000;

        // The check: all notes spawned, all active notes cleared, and past the end time threshold.
        if (notes.length === 0 && activeNotes.length === 0 && audioTime >= gameEndTimeThreshold) {
            console.log('Game end condition met: notes.length:', notes.length, 'activeNotes.length:', activeNotes.length, 'audioTime:', audioTime, 'gameEndTimeThreshold:', gameEndTimeThreshold);
            endGame();
            return;
        }

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function handleKeyPress(laneIndex) {
        const audioTime = gameAudio.currentTime * 1000;
        let bestHitNote = null;
        let bestTimeDifference = Infinity;
        let timingMs = 0;

        for (const note of activeNotes) {
            if (note.lane === laneIndex && !note.hit && !note.missed) {
                // Berechne den Zeitunterschied zwischen Audio und Note, unter Berücksichtigung der Receptor-Position
                const timeDifference = Math.abs(note.time - audioTime);
                if (timeDifference <= HIT_WINDOW_50_MS && timeDifference < bestTimeDifference) {
                    bestTimeDifference = timeDifference;
                    bestHitNote = note;
                    // Berechne, ob der Hit zu früh oder zu spät war
                    timingMs = Math.round(audioTime - note.time);
                }
            }
        }

        if (bestHitNote) {
            bestHitNote.hit = true;

            const hitDelta = bestTimeDifference;
            let judgmentText = '';
            let judgmentClass = '';

            if (hitDelta <= HIT_WINDOW_MAX_MS) {
                judgmentText = 'MAX';
                judgmentClass = 'judgment-max';
                score += 320; // OD8 osu!mania: MAX gibt 320 Punkte
                combo++;
                countMax++;
            } else if (hitDelta <= HIT_WINDOW_300_MS) {
                judgmentText = '300';
                judgmentClass = 'judgment-300';
                score += 300; // OD8 osu!mania: 300 gibt 300 Punkte
                combo++;
                count300++;
            } else if (hitDelta <= HIT_WINDOW_100_MS) {
                judgmentText = '100';
                judgmentClass = 'judgment-100';
                score += 200; // OD8 osu!mania: 100 gibt 200 Punkte
                combo++;
                count100++;
            } else if (hitDelta <= HIT_WINDOW_50_MS) {
                judgmentText = '50';
                judgmentClass = 'judgment-50';
                score += 100; // OD8 osu!mania: 50 gibt 100 Punkte
                combo++;
                count50++;
            }

            bestHitNote.element.classList.add('hit-or-missed');
            displayJudgment(judgmentText, judgmentClass, timingMs);

        } else {
            // Ghosttapping implementation - don't break combo or count as miss when no note is present
            // Just show a ghosttap indicator without affecting score or combo
            displayJudgment('', 'judgment-ghost', 0);
            // Don't reset combo or increment miss count for ghosttapping
        }

        updateScoreAndCombo();
        updateLiveAccuracyDisplay();
    }

    function displayJudgment(text, className, timingMs = 0) {
        // Entferne existierende Judgment-Elemente, um Stacking zu verhindern
        const existingJudgments = document.querySelectorAll('.judgment-text');
        existingJudgments.forEach(element => element.remove());
        
        const judgmentElement = document.createElement('div');
        judgmentElement.classList.add('judgment-text', className);
        // Die Anzeige erfolgt über CSS-Hintergrundbilder
        gameArea.appendChild(judgmentElement);

        // Wenn es ein gültiger Hit ist (nicht ghosttap oder miss), fügen wir einen Tick zur UR-Bar hinzu
        const urBar = document.getElementById('urBar');
        if (urBar && text && text !== 'MISS' && className !== 'judgment-ghost') {
            // Erstelle einen neuen Tick für die UR-Bar
            const tick = document.createElement('div');
            tick.classList.add('ur-tick');
            
            // Berechne die Position auf der UR-Bar (zentriert bei 50%, ±50% für max early/late)
            // Verwende einen engeren Bereich für bessere Visualisierung
            const maxDeviation = 75; // ±75ms auf der UR-Bar (etwas enger für bessere Sichtbarkeit)
            const position = 50 + (timingMs / maxDeviation * 50);
            const clampedPosition = Math.max(0, Math.min(100, position)); // Position auf 0-100% beschränken
            tick.style.left = clampedPosition + '%';
            
            // Färbung je nach Timing
            if (Math.abs(timingMs) <= 16) {  // MAX/Perfect timing (OD8)
                tick.classList.add('perfect');
            } else if (timingMs < 0) {
                tick.classList.add('early');
            } else {
                tick.classList.add('late');
            }
            
            // Füge Tick zur UR-Bar hinzu
            urBar.appendChild(tick);
            
            // Lösche alten Tick nach 2 Sekunden mit Fade-out
            setTimeout(() => {
                tick.style.opacity = '0';
                setTimeout(() => {
                    if (tick.parentNode === urBar) {
                        urBar.removeChild(tick);
                    }
                }, 1000);
            }, 2000);
        }

        // Animation wird jetzt vollständig durch CSS gesteuert

        setTimeout(() => {
            judgmentElement.remove();
        }, 300); // Angepasst an die kürzere Animationsdauer von 0.25s
    }

    function updateScoreAndCombo() {
        comboDisplay.textContent = combo;
        if (combo > maxCombo) {
            maxCombo = combo;
        }
    }

    function resetCombo() {
        combo = 0;
        comboDisplay.textContent = combo;
    }

    function updateLiveAccuracyDisplay() {
        const totalJudgedNotes = countMax + count300 + count100 + count50 + countMiss;

        let accuracy = 0;

        if (totalJudgedNotes === 0) {
            accuracy = 100;
        } else {
            // Exakte osu!mania Punkteberechnung für OD8
            const numerator = (countMax * 320) + (count300 * 300) + (count100 * 200) + (count50 * 100);
            const denominator = totalJudgedNotes * 320; // MAX gibt 320 Punkte in osu!mania
            accuracy = (numerator / denominator) * 100;
        }
        
        accuracy = Math.min(100, Math.max(0, accuracy));

        liveAccuracyDisplay.textContent = `${accuracy.toFixed(2)}%`;
    }

    function calculateRank(accuracy, countMax, count300, count100, count50, countMiss) {
        // osu!mania OD8 Ranking System
        if (accuracy === 100 && count300 === 0 && count100 === 0 && count50 === 0 && countMiss === 0) {
            return 'SS'; // Perfekt
        }
        if (accuracy > 95) {
            return 'S';
        }
        if (accuracy > 90) {
            return 'A';
        }
        if (accuracy > 80) {
            return 'B';
        }
        if (accuracy > 70) {
            return 'C';
        }
        return 'D';
    }

    function endGame() {
        console.log('Ending game...');
        isPlaying = false;
        cancelAnimationFrame(animationFrameId);
        gameAudio.pause();
        gameAudio.currentTime = 0;

        finalScoreDisplay.textContent = score;
        maxComboDisplay.textContent = maxCombo;

        const totalJudgedNotes = countMax + count300 + count100 + count50 + countMiss;
        let finalAccuracy = 0;
        if (totalJudgedNotes === 0) {
            finalAccuracy = 100;
        } else {
            const numerator = (countMax * 300) + (count300 * 300) + (count100 * 100) + (count50 * 50);
            const denominator = totalJudgedNotes * 300;
            finalAccuracy = (numerator / denominator) * 100;
        }
        finalAccuracy = Math.min(100, Math.max(0, finalAccuracy));

        accuracyDisplay.textContent = `${finalAccuracy.toFixed(2)}%`;

        countMaxDisplay.textContent = countMax;
        count300Display.textContent = count300;
        count100Display.textContent = count100;
        count50Display.textContent = count50;
        countMissDisplay.textContent = countMiss;

        const rank = calculateRank(finalAccuracy, countMax, count300, count100, count50, countMiss);
        rankDisplay.textContent = rank;

        console.log('Showing results screen...');
        showScreen('results');
    }

    // Map Search API Functions
    async function searchMaps() {
        const query = mapSearchInput.value.trim();
        if (!query) {
            alert('Please enter a search term.');
            return;
        }

        searchLoading.classList.remove('hidden');
        searchResults.innerHTML = '';
        
        try {
            console.log('Searching for:', query);
            
            // Use nerinyan.moe API which has better search and full metadata
            const params = new URLSearchParams();
            params.append('q', query);
            params.append('limit', '50');
            
            // Force mania mode only since we only want 4K mania
            params.append('mode', '3'); // mania = 3
            
            const response = await fetch(`https://api.nerinyan.moe/search?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status} ${response.statusText}`);
            }

            const results = await response.json();
            console.log('Search response:', results);
            
            // Apply client-side filtering and sorting
            const filteredResults = filterAndSortSearchResults(results);
            
            displaySearchResults(filteredResults);
            
        } catch (error) {
            console.error('Search error:', error);
            let errorMessage = 'Search failed. ';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Please check your internet connection.';
            } else {
                errorMessage += 'Please try again later.';
            }
            searchResults.innerHTML = `<div class="search-error">${errorMessage}</div>`;
        } finally {
            searchLoading.classList.add('hidden');
        }
    }

    function filterAndSortSearchResults(results) {
        const statusFilter = document.getElementById('statusFilter').value;
        
        // Filter by status if specified
        let filteredResults = Array.isArray(results) ? results : [];
        
        if (statusFilter && statusFilter !== 'all') {
            const targetStatus = parseInt(statusFilter);
            filteredResults = filteredResults.filter(set => {
                const setStatus = set.ranked;
                return setStatus === targetStatus;
            });
            console.log(`Filtered from ${results.length} to ${filteredResults.length} maps for status ${targetStatus}`);
        }
        
        // Sort by: ranked > loved > pending, then by play count (popularity)
        filteredResults.sort((a, b) => {
            // Status priority: ranked(1) > approved(2) > loved(4) > qualified(3) > pending(-1) > graveyard(-2)
            const statusPriority = { 1: 5, 2: 5, 4: 4, 3: 3, '-1': 2, 0: 1, '-2': 0 };
            const aPriority = statusPriority[a.ranked] || 0;
            const bPriority = statusPriority[b.ranked] || 0;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }
            
            // If same status, sort by play count (popularity)
            const aPlayCount = a.play_count || 0;
            const bPlayCount = b.play_count || 0;
            return bPlayCount - aPlayCount;
        });
        
        return filteredResults;
    }

    function displaySearchResults(beatmapsets) {
        console.log('Displaying search results:', beatmapsets);
        
        if (beatmapsets.length === 0) {
            searchResults.innerHTML = '<div class="search-placeholder"><p>No maps found. Try different search terms.</p></div>';
            return;
        }

        const resultsHtml = beatmapsets.map(set => {
            // nerinyan.moe API structure
            const id = set.id;
            const title = set.title;
            const artist = set.artist;
            const creator = set.creator;
            const beatmaps = set.beatmaps || [];
            const favourites = set.favourite_count || 0;
            const playCount = set.play_count || 0;
            const rankedStatus = set.ranked;
            
            console.log(`Processing set: ${title} by ${artist}, beatmaps:`, beatmaps);
            
            // Filter for 4K mania difficulties only (mode 3, cs = 4)
            const maniaMaps = beatmaps.filter(b => b.mode_int === 3 && b.cs === 4);
            const maniaCount = maniaMaps.length;
            console.log(`4K Mania count for ${title}: ${maniaCount}`);
            
            // Skip this beatmapset if it has no 4K mania difficulties
            if (maniaCount === 0) {
                return null;
            }
            
            // Get difficulty range for 4K mania maps
            let difficultyInfo = '';
            if (maniaCount > 0) {
                const difficulties = maniaMaps.map(b => b.difficulty_rating || 0);
                const minDiff = Math.min(...difficulties);
                const maxDiff = Math.max(...difficulties);
                const avgBPM = maniaMaps.length > 0 ? Math.round(maniaMaps.reduce((sum, b) => sum + (b.bpm || 0), 0) / maniaMaps.length) : 0;
                const totalLength = Math.max(...maniaMaps.map(b => b.total_length || 0));
                
                difficultyInfo = `
                    <div class="map-stats">
                        <span class="stat-item">★${minDiff.toFixed(2)}${minDiff !== maxDiff ? `-${maxDiff.toFixed(2)}` : ''}</span>
                        <span class="stat-item">${Math.floor(totalLength / 60)}:${(totalLength % 60).toString().padStart(2, '0')}</span>
                        <span class="stat-item">${avgBPM} BPM</span>
                        <span class="stat-item">4K</span>
                        ${favourites > 0 ? `<span class="stat-item">♥${favourites}</span>` : ''}
                        ${playCount > 0 ? `<span class="stat-item">▶${playCount.toLocaleString()}</span>` : ''}
                    </div>
                `;
            }
            
            // Status badge
            const statusNames = {
                '-2': 'Graveyard',
                '-1': 'Pending', 
                '0': 'WIP',
                '1': 'Ranked',
                '2': 'Approved', 
                '3': 'Qualified',
                '4': 'Loved'
            };
            const statusName = statusNames[rankedStatus] || 'Unknown';
            const statusClass = rankedStatus === 1 || rankedStatus === 2 ? 'status-ranked' : 
                               rankedStatus === 4 ? 'status-loved' : 
                               rankedStatus === 3 ? 'status-qualified' : 
                               rankedStatus === -1 ? 'status-pending' :
                               'status-unranked';
            
            // Preview URL (can still use osu's preview)
            const previewUrl = `https://b.ppy.sh/preview/${id}.mp3`;
            
            // Cover image
            const coverUrl = `https://assets.ppy.sh/beatmaps/${id}/covers/card.jpg`;
            
            return `
                <div class="search-result-item" data-set-id="${id}">
                    <div class="result-cover">
                        <img src="${coverUrl}" alt="Cover" loading="lazy" onerror="this.style.display='none'">
                        <div class="preview-overlay">
                            <button class="preview-button" onclick="togglePreview(${id}, '${previewUrl.replace(/'/g, '\\\'')}')" data-set-id="${id}">
                                ▶
                            </button>
                        </div>
                    </div>
                    <div class="result-info">
                        <div class="result-header">
                            <h3>${title}</h3>
                            <span class="status-badge ${statusClass}">${statusName}</span>
                        </div>
                        <p class="result-artist">by ${artist}</p>
                        <p class="result-mapper">mapped by ${creator}</p>
                        <p class="result-difficulties">${maniaCount} 4K mania difficulties</p>
                        ${difficultyInfo}
                    </div>
                    <div class="result-actions">
                        <button onclick="downloadMap(${id})" class="download-button">
                            Load Map
                        </button>
                    </div>
                </div>
            `;
        }).filter(item => item !== null).join('');

        console.log('Generated HTML:', resultsHtml);
        searchResults.innerHTML = resultsHtml;
    }

    async function downloadMap(beatmapsetId) {
        try {
            const downloadButton = document.querySelector(`[data-set-id="${beatmapsetId}"] .download-button`);
            if (downloadButton) {
                downloadButton.textContent = 'Loading...';
                downloadButton.disabled = true;
            }

            console.log(`Loading beatmapset ${beatmapsetId} directly into player...`);

            // Use CORS proxy to avoid direct download to PC
            const downloadUrls = [
                `https://catboy.best/d/${beatmapsetId}`,
                `https://api.chimu.moe/v1/download/${beatmapsetId}?n=1`
            ];

            let response;
            let lastError;
            
            for (const url of downloadUrls) {
                try {
                    console.log(`Loading from: ${url}`);
                    
                    // Fetch with no-store cache to prevent downloads
                    response = await fetch(url, { 
                        method: 'GET',
                        cache: 'no-store',
                        headers: {
                            'Accept': 'application/x-osu-beatmap-archive,application/octet-stream,*/*'
                        }
                    });
                    
                    if (response.ok) {
                        console.log(`Successfully connected to: ${url}`);
                        const contentType = response.headers.get('content-type');
                        console.log('Content-Type:', contentType);
                        
                        // Check if we got beatmap data
                        if (contentType && (contentType.includes('application/x-osu-beatmap-archive') || 
                                          contentType.includes('application/octet-stream') ||
                                          contentType.includes('application/zip'))) {
                            console.log('Got valid beatmap data');
                            break;
                        } else {
                            console.log('Invalid content type, trying next source');
                            response = null;
                        }
                    } else {
                        console.log(`Failed ${url} with status: ${response.status}`);
                        response = null;
                    }
                } catch (error) {
                    console.log(`Error with ${url}:`, error);
                    lastError = error;
                    response = null;
                }
            }
            
            if (!response) {
                throw lastError || new Error('Could not load beatmap data');
            }

            // Convert response to ArrayBuffer for processing (in memory only)
            const arrayBuffer = await response.arrayBuffer();
            
            // Validate beatmap data
            if (arrayBuffer.byteLength === 0) {
                throw new Error('Beatmap data is empty');
            }
            
            if (arrayBuffer.byteLength < 1000) {
                throw new Error('Beatmap data seems incomplete');
            }
            
            console.log(`Loaded ${arrayBuffer.byteLength} bytes of beatmap data`);
            
            // Update button state
            if (downloadButton) {
                downloadButton.textContent = 'Processing...';
            }
            
            // Process the beatmap data using the existing loadOszFile logic
            console.log('Processing beatmap data in browser...');
            
            // Create a File object from the ArrayBuffer to simulate file upload
            const blob = new Blob([arrayBuffer], { type: 'application/x-osu-beatmap-archive' });
            const file = new File([blob], `beatmapset_${beatmapsetId}.osz`, { type: 'application/x-osu-beatmap-archive' });
            
            // Use the existing loadOszFile function that already works
            await loadOszFile(file);
            
            // Switch to menu screen to play the loaded map
            console.log('Beatmap loaded successfully, switching to menu...');
            hideOverlay(mapSearchOverlay);
            showScreen('menu');
            
            // Update button to show success
            if (downloadButton) {
                downloadButton.textContent = '✓ Loaded';
                downloadButton.disabled = true;
                downloadButton.style.backgroundColor = '#4caf50';
                downloadButton.style.color = 'white';
            }
            
            console.log('Beatmap is now ready to play!');
            
        } catch (error) {
            console.error('Failed to load beatmap:', error);
            
            const downloadButton = document.querySelector(`[data-set-id="${beatmapsetId}"] .download-button`);
            if (downloadButton) {
                downloadButton.textContent = 'Load Failed';
                downloadButton.disabled = false;
                downloadButton.style.backgroundColor = '#f44336';
                
                // Reset after a few seconds
                setTimeout(() => {
                    downloadButton.textContent = 'Try Again';
                    downloadButton.style.backgroundColor = '';
                    downloadButton.style.color = '';
                }, 3000);
            }
        }
    }

    // Make downloadMap available globally
    window.downloadMap = downloadMap;

    // Preview sound functionality
    let currentPreviewAudio = null;
    let currentPreviewButton = null;

    function togglePreview(setId, previewUrl) {
        const button = document.querySelector(`[data-set-id="${setId}"] .preview-button`);
        
        // If clicking the same button that's currently playing
        if (currentPreviewAudio && currentPreviewButton === button) {
            if (currentPreviewAudio.paused) {
                currentPreviewAudio.play();
                button.textContent = '⏸';
            } else {
                currentPreviewAudio.pause();
                button.textContent = '▶';
            }
            return;
        }
        
        // Stop any currently playing preview
        if (currentPreviewAudio) {
            currentPreviewAudio.pause();
            currentPreviewAudio.src = '';
            currentPreviewAudio = null;
        }
        
        // Reset all preview buttons
        document.querySelectorAll('.preview-button').forEach(btn => {
            btn.textContent = '▶';
            btn.classList.remove('playing');
        });
        
        // Start new preview
        try {
            currentPreviewAudio = new Audio(previewUrl);
            currentPreviewButton = button;
            
            currentPreviewAudio.volume = 0.5; // Set volume to 50%
            currentPreviewAudio.currentTime = 0;
            
            button.textContent = '⏸';
            button.classList.add('playing');
            
            currentPreviewAudio.play().catch(error => {
                console.warn('Preview failed to play:', error);
                button.textContent = '✗';
                setTimeout(() => {
                    button.textContent = '▶';
                    button.classList.remove('playing');
                }, 2000);
            });
            
            // Auto-stop after ended
            currentPreviewAudio.addEventListener('ended', () => {
                button.textContent = '▶';
                button.classList.remove('playing');
                currentPreviewAudio = null;
                currentPreviewButton = null;
            });
            
            // Handle errors
            currentPreviewAudio.addEventListener('error', () => {
                button.textContent = '✗';
                button.classList.remove('playing');
                setTimeout(() => {
                    button.textContent = '▶';
                }, 2000);
                currentPreviewAudio = null;
                currentPreviewButton = null;
            });
            
        } catch (error) {
            console.error('Error creating preview audio:', error);
            button.textContent = '✗';
            setTimeout(() => button.textContent = '▶', 2000);
        }
    }

    // Make togglePreview available globally
    window.togglePreview = togglePreview;

    // Helper function to load OSZ from ArrayBuffer (for downloaded maps)
    async function loadOszFileFromArrayBuffer(arrayBuffer) {
        console.log('Loading OSZ from ArrayBuffer...');
        const zip = new JSZip();
        const content = await zip.loadAsync(arrayBuffer);
        console.log('ZIP content loaded from ArrayBuffer.');

        availableBeatmaps = [];
        audioFilesMap.clear();
        imageFilesMap.clear();
        difficultyListContainer.innerHTML = '';
        startButton.disabled = true;
        gameAudio.pause();
        gameAudio.src = '';

        const osuFileEntries = [];

        content.forEach((relativePath, zipEntry) => {
            if (relativePath.endsWith('.osu')) {
                osuFileEntries.push(zipEntry);
            } else if (/\.(mp3|ogg|wav)$/i.test(relativePath)) {
                audioFilesMap.set(relativePath, zipEntry);
            } else if (/\.(jpg|jpeg|png|gif|bmp)$/i.test(relativePath)) {
                imageFilesMap.set(relativePath, zipEntry);
            }
        });

        console.log(`Found ${osuFileEntries.length} .osu files.`);

        for (const zipEntry of osuFileEntries) {
            try {
                const osuFileContent = await zipEntry.async('text');
                console.log(`Processing ${zipEntry.name}...`);
                
                const beatmap = parseOsuFile(osuFileContent);
                if (!beatmap) {
                    console.log(`Failed to parse ${zipEntry.name}`);
                    continue;
                }
                
                // Check if this is a mania beatmap (Mode 3)
                const mode = parseInt(beatmap.general?.Mode || beatmap.metadata?.Mode || 0);
                
                console.log(`Mode: ${mode}, HitObjects: ${beatmap.hitObjects?.length || 0}`);
                
                // Load all mania beatmaps (Mode 3) regardless of key count
                if (beatmap.hitObjects && beatmap.hitObjects.length > 0 && mode === 3) {
                    availableBeatmaps.push(beatmap);
                    console.log(`✓ Added mania beatmap: ${beatmap.metadata.Title} [${beatmap.metadata.Version}]`);
                } else {
                    console.log(`✗ Skipped non-mania beatmap: ${beatmap.metadata.Title} [${beatmap.metadata.Version}] (Mode: ${mode})`);
                }
            } catch (error) {
                console.error(`Error parsing ${zipEntry.name}:`, error);
            }
        }

        console.log(`Found ${availableBeatmaps.length} mania beatmaps`);

        if (availableBeatmaps.length === 0) {
            console.warn('No mania beatmaps found, loading any beatmap...');
            
            // As last fallback, load any beatmap
            for (const zipEntry of osuFileEntries) {
                try {
                    const osuFileContent = await zipEntry.async('text');
                    const beatmap = parseOsuFile(osuFileContent);
                    
                    if (beatmap && beatmap.hitObjects && beatmap.hitObjects.length > 0) {
                        availableBeatmaps.push(beatmap);
                        console.log(`Added any beatmap: ${beatmap.metadata.Title} [${beatmap.metadata.Version}]`);
                        break; // Just add the first working beatmap
                    }
                } catch (error) {
                    console.error(`Error in fallback parsing:`, error);
                }
            }
        }

        availableBeatmaps.sort((a, b) => {
            const starsA = parseFloat(a.metadata.Stars) || 0;
            const starsB = parseFloat(b.metadata.Stars) || 0;
            return starsA - starsB;
        });

        console.log(`Total valid beatmaps: ${availableBeatmaps.length}`);
        
        // Clear and populate difficulty list
        difficultyListContainer.innerHTML = '';
        availableBeatmaps.forEach((bm, index) => {
            const difficultyItem = document.createElement('div');
            difficultyItem.classList.add('difficulty-item');
            difficultyItem.dataset.index = index;
            difficultyItem.textContent = bm.name;
            difficultyListContainer.appendChild(difficultyItem);
        });

        if (availableBeatmaps.length > 0) {
            console.log('Selecting first available beatmap difficulty.');
            difficultyListContainer.querySelector('.difficulty-item').click();
        }

        const backgroundImagePath = getMapBackgroundImagePath();
        if (backgroundImagePath) {
            await setMapBackgroundImage(backgroundImagePath);
        }

        const firstBeatmap = availableBeatmaps[0];
        mapTitle.textContent = firstBeatmap.metadata.Title || 'Unknown Title';
        
        showScreen('menu');
        updateScrollSpeedDisplay(); 
        updateMapRateDisplay();
    }

    // Initial state setup
    startButton.disabled = true;
    scrollSpeedInput.disabled = false;
    mapRateInput.disabled = false;
    preservePitchToggle.disabled = false;
    liveAccuracyDisplay.textContent = '0.00%';
    songProgressBarFill.style.width = '0%';

    // Apply loaded settings and ensure they're within valid ranges
    // Ensure scrollSpeed is between 10-40 (osu!mania standard)
    currentScrollSpeed = Math.max(10, Math.min(40, Math.round(currentScrollSpeed)));
    scrollSpeedInput.value = currentScrollSpeed;
    
    // Map rate remains between 0.5 and 2.0
    currentMapRate = Math.max(0.5, Math.min(2.0, currentMapRate));
    mapRateInput.value = currentMapRate;

    updateScrollSpeedDisplay();
    updateMapRateDisplay();
    loadKeybinds();
    loadCustomColors();

    // Sicherstellen, dass die Audio-Geschwindigkeit korrekt gesetzt ist
    if (gameAudio.src) {
        gameAudio.playbackRate = currentMapRate;
        gameAudio.preservesPitch = !preservePitchToggle.checked;
    }
    
    // Ensure the start screen is shown initially
    showScreen('start');
