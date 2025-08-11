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
    let currentScrollSpeed = parseFloat(localStorage.getItem('scrollSpeed') || scrollSpeedInput.value);
    let currentMapRate = parseFloat(localStorage.getItem('mapRate') || mapRateInput.value);

    // Keybind State
    const DEFAULT_LANE_KEYS = ['D', 'F', 'J', 'K'];
    let LANE_KEYS = [...DEFAULT_LANE_KEYS];
    let changingKeybindIndex = -1;

    // Game Constants
    const PLAYFIELD_SCALE = 1.3;
    const BASE_FALL_SPEED_PX_PER_MS = 0.1; 
    const GAME_AREA_HEIGHT = 600 * PLAYFIELD_SCALE;
    const RECEPTOR_HEIGHT = 70 * PLAYFIELD_SCALE;
    const JUDGMENT_OFFSET_FROM_RECEPTOR_BOTTOM = 50 * PLAYFIELD_SCALE;

    let od = 8; 

    const HIT_WINDOW_MAX_MS = 16.5;
    const HIT_WINDOW_300_MS = 22;
    const HIT_WINDOW_100_MS = 43;
    const HIT_WINDOW_50_MS = 64;

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
        const accent = localStorage.getItem('customAccentColor');
        const note1 = localStorage.getItem('customNoteColor1');
        const note2 = localStorage.getItem('customNoteColor2');
        const note3 = localStorage.getItem('customNoteColor3');
        const note4 = localStorage.getItem('customNoteColor4');

        if (accent) document.documentElement.style.setProperty('--accent-color', accent);
        if (note1) document.documentElement.style.setProperty('--note-color-1', note1);
        if (note2) document.documentElement.style.setProperty('--note-color-2', note2);
        if (note3) document.documentElement.style.setProperty('--note-color-3', note3);
        if (note4) document.documentElement.style.setProperty('--note-color-4', note4);

        if (accentColorInput && accent) accentColorInput.value = accent;
        if (noteColor1Input && note1) noteColor1Input.value = note1;
        if (noteColor2Input && note2) noteColor2Input.value = note2;
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
        currentScrollSpeed = parseFloat(scrollSpeedInput.value);
        localStorage.setItem('scrollSpeed', currentScrollSpeed);
        updateScrollSpeedDisplay();
    });

    scrollSpeedValueDisplay.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.min = scrollSpeedInput.min;
        input.max = scrollSpeedInput.max;
        input.value = currentScrollSpeed;
        input.classList.add('navbar-value-input');

        scrollSpeedValueDisplay.replaceWith(input);
        input.focus();

        const handleInputEnd = () => {
            let newValue = parseFloat(input.value);
            if (isNaN(newValue) || newValue < parseFloat(scrollSpeedInput.min) || newValue > parseFloat(scrollSpeedInput.max)) {
                newValue = parseFloat(scrollSpeedInput.value);
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

    customizeButton.addEventListener('click', () => {
        showOverlay(customizeOverlay);
        accentColorInput.value = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
        noteColor1Input.value = getComputedStyle(document.documentElement).getPropertyValue('--note-color-1');
        noteColor2Input.value = getComputedStyle(document.documentElement).getPropertyValue('--note-color-2');
        noteColor3Input.value = getComputedStyle(document.documentElement).getPropertyValue('--note-color-3');
        noteColor4Input.value = getComputedStyle(document.documentElement).getPropertyValue('--note-color-4');
    });

    closeCustomizeOverlayButton.addEventListener('click', () => {
        hideOverlay(customizeOverlay);
    });

    accentColorInput.addEventListener('input', (e) => saveCustomColor('--accent-color', e.target.value));
    noteColor1Input.addEventListener('input', (e) => saveCustomColor('--note-color-1', e.target.value));
    noteColor2Input.addEventListener('input', (e) => saveCustomColor('--note-color-2', e.target.value));
    noteColor3Input.addEventListener('input', (e) => saveCustomColor('--note-color-3', e.target.value));
    noteColor4Input.addEventListener('input', (e) => saveCustomColor('--note-color-4', e.target.value));


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
            throw new Error('No valid beatmaps with accessible audio files found in the archive.');
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
        return parsed;
    }

    function updateScrollSpeedDisplay() {
        scrollSpeedValueDisplay.textContent = `${currentScrollSpeed.toFixed(1)}x`;
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
    }

    function gameLoop(currentTime) {
        if (!isPlaying) return;

        const audioTime = gameAudio.currentTime * 1000;
        const effectiveNoteFallSpeed = BASE_FALL_SPEED_PX_PER_MS * currentScrollSpeed;

        if (gameAudio.duration) {
            const progress = (gameAudio.currentTime / gameAudio.duration) * 100;
            songProgressBarFill.style.width = `${progress}%`;
        }

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

        for (const note of activeNotes) {
            if (note.lane === laneIndex && !note.hit && !note.missed) {
                const timeDifference = Math.abs(note.time - audioTime);
                if (timeDifference <= HIT_WINDOW_50_MS && timeDifference < bestTimeDifference) {
                    bestTimeDifference = timeDifference;
                    bestHitNote = note;
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
                score += 300;
                combo++;
                countMax++;
            } else if (hitDelta <= HIT_WINDOW_300_MS) {
                judgmentText = '300';
                judgmentClass = 'judgment-300';
                score += 300;
                combo++;
                count300++;
            } else if (hitDelta <= HIT_WINDOW_100_MS) {
                judgmentText = '100';
                judgmentClass = 'judgment-100';
                score += 100;
                combo++;
                count100++;
            } else if (hitDelta <= HIT_WINDOW_50_MS) {
                judgmentText = '50';
                judgmentClass = 'judgment-50';
                score += 50;
                combo++;
                count50++;
            }

            bestHitNote.element.classList.add('hit-or-missed');
            displayJudgment(judgmentText, judgmentClass);

        } else {
            displayJudgment('MISS', 'judgment-miss');
            resetCombo();
            countMiss++;
            console.log('Miss (no note in hit window)!');
        }

        updateScoreAndCombo();
        updateLiveAccuracyDisplay();
    }

    function displayJudgment(text, className) {
        const judgmentElement = document.createElement('div');
        judgmentElement.classList.add('judgment-text', className);
        judgmentElement.textContent = text;
        gameArea.appendChild(judgmentElement);

        requestAnimationFrame(() => {
            judgmentElement.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
            judgmentElement.style.transform = 'translateX(-50%) translateY(-70px)';
            judgmentElement.style.opacity = '0';
        });

        setTimeout(() => {
            judgmentElement.remove();
        }, 400);
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
            const numerator = (countMax * 300) + (count300 * 300) + (count100 * 100) + (count50 * 50);
            const denominator = totalJudgedNotes * 300;
            accuracy = (numerator / denominator) * 100;
        }
        
        accuracy = Math.min(100, Math.max(0, accuracy));

        liveAccuracyDisplay.textContent = `${accuracy.toFixed(2)}%`;
    }

    function calculateRank(accuracy, countMax, count300, count100, count50, countMiss) {
        if (accuracy === 100 && count300 === 0 && count100 === 0 && count50 === 0 && countMiss === 0) {
            return 'SS';
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

    // Initial state setup
    startButton.disabled = true;
    scrollSpeedInput.disabled = false;
    mapRateInput.disabled = false;
    preservePitchToggle.disabled = false;
    liveAccuracyDisplay.textContent = '0.00%';
    songProgressBarFill.style.width = '0%';

    // Apply loaded settings
    scrollSpeedInput.value = currentScrollSpeed;
    mapRateInput.value = currentMapRate;

    updateScrollSpeedDisplay();
    updateMapRateDisplay();
    loadKeybinds();
    loadCustomColors();

    // Ensure the start screen is shown initially
    showScreen('start');
