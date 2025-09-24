class ApplePuzzleGame {
    constructor() {
        this.gridSize = { rows: 8, cols: 15 };
        this.totalApples = this.gridSize.rows * this.gridSize.cols;
        this.apples = [];
        this.selectedApples = new Set();
        this.score = 0;
        this.gameTime = 0;
        this.gameTimer = null;
        this.isGameOver = false;
        this.autoClearTimer = null;
        this.autoClearTime = 0.7; // 0.7초
        this.gameTimeLimit = 60; // 게임 제한 시간
        this.audioContext = null;
        this.backgroundMusicPlaying = false;
        this.backgroundMusic = null;
        this.bgMusicEnabled = true;
        this.successCount = 0; // 성공 횟수 카운터
        this.currentMusicIndex = 0; // 현재 재생 중인 음악 인덱스
        this.musicVolume = 0.3; // 기본 볼륨 30%
        
        // 효과음 파일들
        this.sfxClick = new Audio('sfx_click.mp3');
        this.sfxSuccess = new Audio('sfx_success.mp3');
        this.sfxWarning = new Audio('sfx_warning.mp3');
        this.sfxFail = new Audio('sfx_fail.mp3');
        
        // 효과음 볼륨 설정
        this.sfxClick.volume = 0.5;
        this.sfxSuccess.volume = 0.7;
        this.sfxWarning.volume = 0.6;
        this.sfxFail.volume = 0.8;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.createGrid();
        this.setupEventListeners();
        this.startGameTimer();
        this.updateDisplay();
        this.initializeAudio();
    }
    
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    startBackgroundMusic() {
        if (!this.bgMusicEnabled || this.backgroundMusicPlaying) return;
        
        this.backgroundMusicPlaying = true;
        this.playNextMusic();
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.backgroundMusicPlaying = false;
            console.log('배경음악 정지');
        }
    }
    
    playNextMusic() {
        if (!this.backgroundMusicPlaying || !this.bgMusicEnabled) return;
        
        const musicFiles = [
            '사과 팡팡 (Apple Pop Pop) (1).mp3',
            '사과 팡팡 (Apple Pop Pop) (1) (1).mp3',
            '사과 팡팡 (Apple Pop Pop) (2).mp3',
            '사과 팡팡 (Apple Pop Pop) (3).mp3'
        ];
        
        try {
            this.backgroundMusic = new Audio(musicFiles[this.currentMusicIndex]);
            this.backgroundMusic.volume = this.musicVolume;
            
            this.backgroundMusic.addEventListener('ended', () => {
                if (this.backgroundMusicPlaying && this.bgMusicEnabled) {
                    this.currentMusicIndex = (this.currentMusicIndex + 1) % musicFiles.length;
                    this.playNextMusic();
                }
            });
            
            this.backgroundMusic.play();
            console.log(`배경음악 ${this.currentMusicIndex + 1}번 재생 시작`);
        } catch (e) {
            console.log('배경음악 재생 실패:', e);
        }
    }
    
    updateVolume(volumePercent) {
        this.musicVolume = volumePercent / 100;
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
    }
    
    toggleBackgroundMusic() {
        this.bgMusicEnabled = !this.bgMusicEnabled;
        if (this.bgMusicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
    }
    
    showSuccessMessage() {
        this.successCount++;
        
        let message = '';
        let className = '';
        
        // 순서에 따른 메시지와 색상 결정
        switch (this.successCount) {
            case 1:
                message = '1st!';
                className = 'first';
                break;
            case 2:
                message = '2nd!';
                className = 'second';
                break;
            case 3:
                message = '3rd!';
                className = 'third';
                break;
            default:
                message = `${this.successCount}th!`;
                className = 'other';
                break;
        }
        
        const successElement = document.getElementById('successMessage');
        successElement.textContent = message;
        successElement.className = `success-message ${className}`;
        
        // 애니메이션 재시작을 위해 클래스 제거 후 다시 추가
        successElement.style.animation = 'none';
        successElement.offsetHeight; // 강제 리플로우
        successElement.style.animation = 'successPop 1.5s ease-out forwards';
        
        console.log(`성공! ${message} (총 ${this.successCount}번째 성공)`);
    }
    
    playSuccessSound() {
        // 성공 효과음 재생
        this.sfxSuccess.currentTime = 0;
        this.sfxSuccess.play().catch(e => console.log('성공 효과음 재생 실패:', e));
    }
    
    createGrid() {
        const gameGrid = document.getElementById('gameGrid');
        gameGrid.innerHTML = '';
        
        this.apples = [];
        
        for (let row = 0; row < this.gridSize.rows; row++) {
            this.apples[row] = [];
            for (let col = 0; col < this.gridSize.cols; col++) {
                const appleElement = this.createAppleElement(row, col);
                gameGrid.appendChild(appleElement);
                this.apples[row][col] = {
                    element: appleElement,
                    number: this.getRandomNumber(),
                    row: row,
                    col: col,
                    isEmpty: false
                };
                appleElement.innerHTML = `<span>${this.apples[row][col].number}</span>`;
                // 초기화 시 모든 스타일 리셋
                appleElement.className = 'apple';
                appleElement.style.opacity = '';
                appleElement.style.border = '';
            }
        }
    }
    
    createAppleElement(row, col) {
        const apple = document.createElement('div');
        apple.className = 'apple';
        apple.dataset.row = row;
        apple.dataset.col = col;
        return apple;
    }
    
    getRandomNumber() {
        return Math.floor(Math.random() * 9) + 1; // 1-9 사이의 숫자
    }
    
    setupEventListeners() {
        const gameGrid = document.getElementById('gameGrid');
        
        // 클릭으로 사과 선택/해제
        gameGrid.addEventListener('click', (e) => {
            e.preventDefault(); // 기본 동작 방지
            e.stopPropagation(); // 이벤트 전파 차단
            e.stopImmediatePropagation(); // 즉시 전파 차단
            
            // 클릭된 요소가 span이면 부모 요소(사과)를 찾기
            let appleElement = e.target;
            if (e.target.tagName === 'SPAN') {
                appleElement = e.target.closest('.apple');
            }
            
            if (this.isGameOver || !appleElement || appleElement.classList.contains('empty')) return;
            
            // 오디오 컨텍스트 활성화 (사용자 인터랙션)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const row = parseInt(appleElement.dataset.row);
            const col = parseInt(appleElement.dataset.col);
            
            // 클릭 효과음 재생
            this.sfxClick.currentTime = 0;
            this.sfxClick.play().catch(e => {
                // 콘솔 로그도 차단
            });
            
            if (this.selectedApples.has(`${row}-${col}`)) {
                // 이미 선택된 사과면 선택 해제
                this.deselectApple(row, col);
            } else {
                // 선택되지 않은 사과면 선택
                this.selectApple(row, col);
            }
            
            this.updateSelectionDisplay();
            
            // 즉시 스크롤 위치 고정
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            return false; // 추가 차단
        }, true); // capture 단계에서 처리
        
        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (this.isGameOver) return;
            
            // 오디오 컨텍스트 활성화 (사용자 인터랙션)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.clearSelection();
                this.updateSelectionDisplay();
            } else if (e.code === 'Enter') {
                e.preventDefault();
                this.checkSelection();
            }
        });
    }
    
    deselectApple(row, col) {
        this.selectedApples.delete(`${row}-${col}`);
        this.apples[row][col].element.classList.remove('selected');
        console.log(`사과 [${row},${col}] 선택 해제됨 (숫자: ${this.apples[row][col].number})`);
    }
    
    updateSelectionDisplay() {
        let sum = 0;
        const selectedNumbers = [];
        
        this.selectedApples.forEach(pos => {
            const [row, col] = pos.split('-').map(Number);
            sum += this.apples[row][col].number;
            selectedNumbers.push(this.apples[row][col].number);
        });
        
        // 합이 10을 초과하면 자동으로 선택 해제
        if (sum > 10) {
            console.log(`합이 ${sum}으로 10을 초과하여 자동 해제`);
            // 경고 효과음 재생
            this.sfxWarning.currentTime = 0;
            this.sfxWarning.play().catch(e => console.log('경고 효과음 재생 실패:', e));
            this.clearSelection();
            return;
        }
        
        // 합이 정확히 10이면 자동으로 제거
        if (sum === 10 && this.selectedApples.size > 0) {
            console.log('합이 10이 되어 자동 제거 실행');
            this.playSuccessSound(); // 성공 소리 재생
            this.showSuccessMessage(); // 성공 메시지 표시
            this.autoRemoveApples();
            return;
        }
        
        // 선택된 사과들의 합계를 화면에 표시 (비활성화)
        // this.showSelectionInfo(sum, selectedNumbers);
        
        // 기존 선택 정보 제거
        const existingInfo = document.querySelector('.selection-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // 타이머 관리
        this.manageAutoClearTimer(sum);
    }
    
    autoRemoveApples() {
        // 타이머 정리
        if (this.autoClearTimer) {
            clearTimeout(this.autoClearTimer);
            this.autoClearTimer = null;
        }
        
        console.log('자동 제거 실행 - 선택된 사과들:', Array.from(this.selectedApples));
        
        // 점수 추가 (선택한 사과 개수)
        this.score += this.selectedApples.size;
        
        // 사과 제거
        this.selectedApples.forEach(pos => {
            const [row, col] = pos.split('-').map(Number);
            this.apples[row][col].isEmpty = true;
            this.apples[row][col].element.classList.add('empty');
            this.apples[row][col].element.innerHTML = '';
            console.log(`사과 [${row},${col}] 자동 제거됨`);
        });
        
        // 선택 정보 표시 제거
        const existingInfo = document.querySelector('.selection-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // 선택 상태 초기화
        this.selectedApples.clear();
        
        // 점수 업데이트
        this.updateDisplay();
        
        console.log('자동 제거 완료');
    }
    
    manageAutoClearTimer(sum) {
        // 기존 타이머 제거
        if (this.autoClearTimer) {
            clearTimeout(this.autoClearTimer);
            this.autoClearTimer = null;
        }
        
        // 선택된 사과가 있고 합이 10이 아니면 타이머 시작
        if (this.selectedApples.size > 0 && sum !== 10) {
            this.autoClearTimer = setTimeout(() => {
                console.log(`${this.autoClearTime}초 후 자동 해제 (합: ${sum})`);
                this.clearSelection();
            }, this.autoClearTime * 1000);
        }
    }
    
    showSelectionInfo(sum, numbers) {
        // 기존 정보 표시 제거
        const existingInfo = document.querySelector('.selection-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        if (this.selectedApples.size > 0) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'selection-info';
            
            // 타이머 표시 (합이 10이 아닐 때만)
            let timerDisplay = '';
            if (sum !== 10 && this.autoClearTimer) {
                timerDisplay = `<div class="timer-warning">⏰ ${this.autoClearTime}초 후 자동 해제</div>`;
            }
            
            infoDiv.innerHTML = `
                <div>선택된 사과: ${numbers.join(', ')}</div>
                <div class="sum-display ${sum === 10 ? 'sum-complete' : ''}">합계: ${sum}</div>
                ${sum === 10 ? '<div class="auto-remove-hint">🎉 합이 10! 자동 제거됩니다!</div>' : timerDisplay}
                <div class="controls-hint">Enter: 수동 확인 | Space: 초기화</div>
            `;
            
            document.querySelector('.game-info').appendChild(infoDiv);
        }
    }
    
    selectApple(row, col) {
        console.log(`selectApple 호출: [${row},${col}]`);
        
        if (row < 0 || row >= this.gridSize.rows || col < 0 || col >= this.gridSize.cols) {
            console.log('범위 밖 좌표');
            return;
        }
        if (this.apples[row][col].isEmpty) {
            console.log('빈 공간');
            return;
        }
        
        this.selectedApples.add(`${row}-${col}`);
        this.apples[row][col].element.classList.add('selected');
        console.log(`사과 [${row},${col}] 선택됨 (숫자: ${this.apples[row][col].number})`);
    }
    
    clearSelection() {
        // 타이머 정리
        if (this.autoClearTimer) {
            clearTimeout(this.autoClearTimer);
            this.autoClearTimer = null;
        }
        
        this.selectedApples.forEach(pos => {
            const [row, col] = pos.split('-').map(Number);
            this.apples[row][col].element.classList.remove('selected');
        });
        this.selectedApples.clear();
        
        // 선택 정보 표시 제거
        const existingInfo = document.querySelector('.selection-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        console.log('모든 선택 해제됨');
    }
    
    checkSelection() {
        if (this.selectedApples.size === 0) {
            console.log('선택된 사과가 없습니다.');
            return;
        }
        
        // 타이머 정리
        if (this.autoClearTimer) {
            clearTimeout(this.autoClearTimer);
            this.autoClearTimer = null;
        }
        
        let sum = 0;
        const selectedNumbers = [];
        
        console.log('수동 확인 - 선택된 사과 개수:', this.selectedApples.size);
        
        this.selectedApples.forEach(pos => {
            const [row, col] = pos.split('-').map(Number);
            const number = this.apples[row][col].number;
            sum += number;
            selectedNumbers.push(number);
            console.log(`사과 [${row},${col}]: ${number}`);
        });
        
        console.log('수동 확인 - 합계:', sum, '숫자들:', selectedNumbers);
        
        if (sum === 10) {
            console.log('수동 확인 - 조건 달성! 사과 제거 중...');
            this.playSuccessSound(); // 성공 소리 재생
            this.showSuccessMessage(); // 성공 메시지 표시
            // 점수 추가 (선택한 사과 개수)
            this.score += this.selectedApples.size;
            this.removeSelectedApples();
            this.updateDisplay();
        } else {
            console.log('수동 확인 - 조건 미달성, 선택 해제');
            // 선택 해제
            this.clearSelection();
        }
    }
    
    removeSelectedApples() {
        console.log('제거할 사과들:', Array.from(this.selectedApples));
        
        this.selectedApples.forEach(pos => {
            const [row, col] = pos.split('-').map(Number);
            this.apples[row][col].isEmpty = true;
            this.apples[row][col].element.classList.add('empty');
            this.apples[row][col].element.innerHTML = '';
            console.log(`사과 [${row},${col}] 제거됨`);
        });
        
        this.clearSelection();
        console.log('사과 제거 완료');
    }
    
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            this.gameTime++;
            this.updateDisplay();
            
            if (this.gameTime >= this.gameTimeLimit) {
                this.endGame();
            }
        }, 1000);
    }
    
    endGame() {
        this.isGameOver = true;
        clearInterval(this.gameTimer);
        
        document.getElementById('status').textContent = 'finished';
        
        // 실패 효과음 재생
        this.sfxFail.currentTime = 0;
        this.sfxFail.play().catch(e => console.log('실패 효과음 재생 실패:', e));
        
        // 게임 오버 화면 표시
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over';
        gameOverDiv.innerHTML = `
            <div class="game-over-content">
                <h2>🎉 게임 종료!</h2>
                <div class="final-score">최종 점수: ${this.score}점</div>
                <button class="restart-btn" onclick="resetGame()">다시 시작</button>
            </div>
        `;
        
        document.body.appendChild(gameOverDiv);
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('time').textContent = this.gameTime;
    }
    
    reset() {
        this.score = 0;
        this.gameTime = 0;
        this.isGameOver = false;
        this.selectedApples.clear();
        this.successCount = 0; // 성공 카운터 초기화
        
        // 게임 오버 화면 제거
        const gameOverDiv = document.querySelector('.game-over');
        if (gameOverDiv) {
            gameOverDiv.remove();
        }
        
        // 타이머 초기화
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // 게임 상태 초기화
        document.getElementById('status').textContent = 'playing';
        
        this.initializeGame();
    }
}

// 게임 인스턴스 생성
let game;

// 게임 초기화 함수
function initGame() {
    game = new ApplePuzzleGame();
    
    // 설정값 적용
    game.gameTimeLimit = gameSettings.gameTime;
    game.autoClearTime = gameSettings.autoCancelDelay;
    game.bgMusicEnabled = gameSettings.bgMusicEnabled;
    game.musicVolume = gameSettings.volume / 100;
    
    // 배경음악 시작
    if (game.bgMusicEnabled) {
        setTimeout(() => {
            game.startBackgroundMusic();
        }, 1000);
    }
}

// 게임 리셋 함수
function resetGame() {
    if (game) {
        game.reset();
    } else {
        initGame();
    }
}

// 인트로 및 설정 관련 함수들
let gameSettings = {
    gameTime: 60,
    autoCancelDelay: 0.7,
    bgMusicEnabled: true,
    volume: 30
};

function showSettings() {
    event.preventDefault();
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'flex';
}

function hideSettings() {
    event.preventDefault();
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('introScreen').style.display = 'flex';
}

function updateGameTime(value) {
    gameSettings.gameTime = parseInt(value);
    document.getElementById('gameTimeValue').textContent = value;
}

function updateAutoCancel(value) {
    gameSettings.autoCancelDelay = parseFloat(value);
    document.getElementById('autoCancelValue').textContent = value;
}

function updateVolume(value) {
    gameSettings.volume = parseInt(value);
    document.getElementById('volumeValue').textContent = value;
    
    // 현재 게임이 실행 중이면 즉시 적용
    if (game) {
        game.updateVolume(value);
    }
}

function toggleBackgroundMusic() {
    gameSettings.bgMusicEnabled = !gameSettings.bgMusicEnabled;
    
    const button = document.getElementById('bgMusicToggle');
    if (gameSettings.bgMusicEnabled) {
        button.textContent = '🎵 배경음 켜기';
        button.classList.remove('disabled');
    } else {
        button.textContent = '🔇 배경음 끄기';
        button.classList.add('disabled');
    }
    
    // 현재 게임이 실행 중이면 즉시 적용
    if (game) {
        game.bgMusicEnabled = gameSettings.bgMusicEnabled;
        if (game.bgMusicEnabled) {
            game.startBackgroundMusic();
        } else {
            game.stopBackgroundMusic();
        }
    }
}

function startGame() {
    event.preventDefault();
    startGameWithSettings();
}

function startGameFromSettings() {
    event.preventDefault();
    startGameWithSettings();
}

function startGameWithSettings() {
    // 인트로와 설정 화면 숨기기
    document.getElementById('introScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'none';
    
    // 게임 화면 보이기
    document.getElementById('gameScreen').style.display = 'flex';
    
    // 게임 시작
    initGame();
}

function goToIntro() {
    event.preventDefault();
    // 게임 화면 숨기기
    document.getElementById('gameScreen').style.display = 'none';
    
    // 게임 리셋
    if (game) {
        game.stopBackgroundMusic();
        game.reset();
    }
    
    // 인트로 화면 보이기
    document.getElementById('introScreen').style.display = 'flex';
}

// 모든 팝업과 알림 차단
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = '';
});

// 팝업 차단
window.addEventListener('popstate', (e) => {
    e.preventDefault();
    history.pushState(null, null, window.location.href);
});

// 스크롤 이벤트 완전 차단
window.addEventListener('scroll', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
});

// 휠 이벤트 차단
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
}, { passive: false });

// 터치 스크롤 차단
window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
}, { passive: false });

// 키보드 스크롤 차단
window.addEventListener('keydown', (e) => {
    if ([32, 33, 34, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});

// 추가 스크롤 차단 이벤트들
window.addEventListener('DOMMouseScroll', (e) => {
    e.preventDefault();
    return false;
});

window.addEventListener('mousewheel', (e) => {
    e.preventDefault();
    return false;
});

// 리사이즈 이벤트로 스크롤 위치 강제 고정
window.addEventListener('resize', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
});

// 주기적으로 스크롤 위치 체크 및 강제 고정
setInterval(() => {
    if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0 || document.body.scrollTop !== 0) {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }
}, 100);

// 기본 팝업 차단 (개발자 도구 차단 제거)
(function() {
    // 우클릭 메뉴 차단
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });
    
    // 드래그 앤 드롭 차단
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    });
    
    // 선택 차단
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    });
})();

// 페이지 로드 시 인트로 화면 표시
window.addEventListener('load', () => {
    // 히스토리 상태 고정
    history.pushState(null, null, window.location.href);
    
    // 즉시 스크롤 위치 고정
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    document.getElementById('introScreen').style.display = 'flex';
    
    // 배경음악 버튼 초기 상태 설정
    const button = document.getElementById('bgMusicToggle');
    if (gameSettings.bgMusicEnabled) {
        button.textContent = '🎵 배경음 켜기';
        button.classList.remove('disabled');
    } else {
        button.textContent = '🔇 배경음 끄기';
        button.classList.add('disabled');
    }
});
