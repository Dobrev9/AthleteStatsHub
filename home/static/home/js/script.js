// Search functionality
function handleSearch(event) {
    event.preventDefault();
    const searchTerm = document.getElementById('athlete-search').value.trim();
    
    if (!searchTerm) {
        displayMessage('Please enter an athlete name to search.', 'error');
        return;
    }

    const normalizedSearchTerm = searchTerm.toLowerCase();
    const foundAthlete = ALL_ATHLETES_FOR_COMPARISON.find(athlete => {
        const athleteNameLower = athlete.name.toLowerCase();
        const nameParts = athleteNameLower.split(' ');
        return athleteNameLower.includes(normalizedSearchTerm) ||
               nameParts.some(part => part.includes(normalizedSearchTerm));
    });

    if (foundAthlete) {
        window.location.href = `/athlete/${foundAthlete.slug}/`;
    } else {
        displayMessage(`No athlete found matching "${searchTerm}". Please try a different name.`, 'error');
    }
}

// Message display
function displayMessage(message, type = 'info') {
    const container = document.querySelector('.container');
    let messageBox = document.getElementById('custom-message-box');

    if (!messageBox) {
        messageBox = document.createElement('div');
        messageBox.id = 'custom-message-box';
        messageBox.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            padding: 15px 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1000; font-weight: 600; opacity: 0; transition: opacity 0.3s ease-in-out;
            display: flex; align-items: center; gap: 10px;
        `;
        container.prepend(messageBox);
    }

    const configs = {
        error: { icon: '❌', bg: '#ffebee', color: '#d32f2f' },
        success: { icon: '✅', bg: '#e8f5e9', color: '#388e3c' },
        info: { icon: 'ℹ️', bg: '#e3f2fd', color: '#1976d2' }
    };
    
    const config = configs[type] || configs.info;
    messageBox.style.backgroundColor = config.bg;
    messageBox.style.color = config.color;
    messageBox.innerHTML = `${config.icon} ${message}`;
    messageBox.style.opacity = '1';

    setTimeout(() => {
        messageBox.style.opacity = '0';
        setTimeout(() => messageBox.remove(), 300);
    }, 3000);
}

// Athlete comparison
let selectedAthletes = [];
const maxSelections = 2;

function initializeAthletes() {
    const grid = document.getElementById('athlete-comparison-grid');
    if (!grid || typeof ALL_ATHLETES_FOR_COMPARISON === 'undefined') return;
    
    grid.innerHTML = '';
    ALL_ATHLETES_FOR_COMPARISON.forEach(athlete => createAthleteCard(athlete, grid));
}

function createAthleteCard(athlete, container) {
    const card = document.createElement('div');
    card.className = 'athlete-card';
    card.dataset.athleteData = JSON.stringify(athlete);

    // Create preview stats from both record and stats
    const previewStats = [];
    
    // Add record information
    if (athlete.record?.wins !== undefined || athlete.record?.losses !== undefined || athlete.record?.draws !== undefined) {
        const { wins = 0, losses = 0, draws = 0 } = athlete.record;
        previewStats.push(`Record: ${wins}W-${losses}L${draws > 0 ? `-${draws}D` : ''}`);
    }
    
    // Add top 2 stats from stat cards
    if (athlete.stats && Object.keys(athlete.stats).length > 0) {
        Object.entries(athlete.stats).slice(0, 2).forEach(([key, value]) => {
            previewStats.push(`${key}: ${value}`);
        });
    }

    const statsHtml = previewStats.map(stat => `<div class="stat-item">${stat}</div>`).join('') ||
                     '<div class="stat-item">No stats available</div>';

    const imagePath = athlete.image.startsWith('/') ? athlete.image : `/static/${athlete.image}`;
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiByeD0iNzUiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB4PSI0NSIgeT0iNDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI3MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYTBhZWMwIj4KPHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPgo8L2x2Zz4KPC9zdmc+';

    card.innerHTML = `
        <img src="${imagePath}" alt="${athlete.name}" class="athlete-card-image" onerror="this.src='${placeholder}'; this.alt='Image unavailable';">
        <div class="athlete-card-name">${athlete.name}</div>
        ${athlete.nickname ? `<div class="athlete-card-nickname">${athlete.nickname}</div>` : ''}
        ${athlete.nationality ? `<div class="athlete-card-nationality">${athlete.nationality}</div>` : ''}
        <div class="athlete-stats-preview">${statsHtml}</div>
    `;

    card.addEventListener('click', () => handleAthleteCardClick(card));
    container.appendChild(card);
}

function handleAthleteCardClick(card) {
    const athleteData = JSON.parse(card.dataset.athleteData);
    const index = selectedAthletes.findIndex(athlete => athlete.slug === athleteData.slug);

    if (index > -1) {
        selectedAthletes.splice(index, 1);
        card.classList.remove('selected');
    } else if (selectedAthletes.length < maxSelections) {
        selectedAthletes.push(athleteData);
        card.classList.add('selected');
    } else {
        displayMessage(`You can only select ${maxSelections} athletes for comparison.`, 'info');
        return;
    }
    updateComparisonDisplay();
}

function updateComparisonDisplay() {
    const grid = document.getElementById('athlete-comparison-grid');
    const results = document.getElementById('comparison-results');

    if (selectedAthletes.length === maxSelections) {
        grid.style.display = 'none';
        results.style.display = 'block';
        displayComparison();
    } else {
        grid.style.display = 'grid';
        results.style.display = 'none';
    }
}

function addAthleteImageToHeader(headerId, athlete) {
    const headerElement = document.getElementById(headerId);
    
    // Remove any existing image container
    const existingContainer = headerElement.querySelector('.athlete-image-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create image container with card styling
    const imageContainer = document.createElement('div');
    imageContainer.className = 'athlete-image-container';
    
    // Create and add the athlete image
    const img = document.createElement('img');
    img.className = 'athlete-header-image';
    img.alt = athlete.name;
    
    // Convert athlete name to filename format (firstname_lastname.png)
    const nameToFilename = (name) => {
        return name.toLowerCase()
                  .replace(/[^a-zA-Z\s]/g, '') // Remove special characters
                  .trim()
                  .replace(/\s+/g, '_') + '.png';
    };
    
    const filename = nameToFilename(athlete.name);
    const imagePath = `/static/home/images/athlete_chests/${filename}`;
    img.src = imagePath;
    
    // Add placeholder fallback
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiByeD0iNzUiIGZpbGw9IiNmMGYwZjAiLz4KPHN2ZyB4PSI0NSIgeT0iNDAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI3MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYTBhZWMwIj4KPHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPgo8L2x2Zz4KPC9zdmc+';
    img.onerror = function() {
        this.src = placeholder;
        this.alt = 'Image unavailable';
    };
    
    imageContainer.appendChild(img);
    
    // Insert the image container after the header text
    headerElement.appendChild(imageContainer);
}

// Updated function to extract opponent win streaks from athlete data
function extractOpponentWinStreaks(athlete) {
    // If the athlete data already includes opponent_win_streak from backend, use it
    if (athlete.opponent_win_streak && athlete.opponent_win_streak.breakdown) {
        return athlete.opponent_win_streak.breakdown;
    }
    
    // Otherwise, try to make an AJAX request to get the data from backend
    return getOpponentWinStreaksFromBackend(athlete.slug);
}

// Function to get opponent win streaks from backend via AJAX
function getOpponentWinStreaksFromBackend(athleteSlug) {
    // Since this is a synchronous operation needed for comparison,
    // we'll use a fallback to example data for now
    // In a real implementation, you'd want to make this async or pre-load the data
    return getExampleOpponentWinStreaks(athleteSlug);
}

// Helper function to parse win streak values like "1-0", "3-0", "6-0"
function parseWinStreakValue(streakText) {
    const match = streakText.match(/(\d+)-\d+/);
    return match ? parseInt(match[1]) : 0;
}

// Updated example data for demonstration - this should match your backend data
function getExampleOpponentWinStreaks(athleteSlug) {
    const exampleData = {
        'ilia_topuria': [1, 3, 0, 0, 6], // Based on your example: 1-0 + 3-0 + 0-0 + 0-0 + 6-0 = 10
        'max_holloway': [2, 1, 4, 0, 3], // Example data
        'alexander_volkanovski': [5, 2, 1, 8, 0], // Example data
        'charles_oliveira': [3, 0, 2, 4, 1], // Example data
        'islam_makhachev': [4, 2, 0, 3, 5], // Example data
        'sean_omalley': [2, 0, 1, 0, 2], // Example data
        // Add more athletes as needed
    };
    
    return exampleData[athleteSlug] || [0]; // Return [0] if no data found
}

// Updated function to calculate total opponent win streak
function calculateTotalOpponentWinStreak(athlete) {
    // First try to use data from backend if available
    if (athlete.opponent_win_streak) {
        return {
            display: athlete.opponent_win_streak.display,
            numeric: athlete.opponent_win_streak.numeric,
            breakdown: athlete.opponent_win_streak.breakdown
        };
    }
    
    // Otherwise calculate from extracted data
    const winStreaks = extractOpponentWinStreaks(athlete);
    const totalWins = winStreaks.reduce((sum, wins) => sum + wins, 0);
    const totalFights = winStreaks.length;
    
    return {
        display: `${totalWins}-0 (${totalFights} fights)`,
        numeric: totalWins,
        breakdown: winStreaks
    };
}

function displayComparison() {
    const [athlete1, athlete2] = selectedAthletes;
    
    // Update athlete names in headers
    document.getElementById('athlete1-name').textContent = athlete1.name;
    document.getElementById('athlete2-name').textContent = athlete2.name;
    document.getElementById('athlete1-header').textContent = athlete1.name;
    document.getElementById('athlete2-header').textContent = athlete2.name;
    
    // Add athlete images below the headers
    addAthleteImageToHeader('athlete1-header', athlete1);
    addAthleteImageToHeader('athlete2-header', athlete2);
    
    // Display all stats for both athletes
    displayAthleteAllStats('athlete1-stats', athlete1);
    displayAthleteAllStats('athlete2-stats', athlete2);
    
    // Display common stats comparison
    displayCommonStats(athlete1, athlete2);
}

// Helper function to determine if lower values are better for a given stat
function isLowerBetterStat(statName) {
    const lowerBetterStats = [
        'losses', 
        'loss', 
        'defeats',
        'knockdowns taken',
        'knockdowns received',
        'damage taken',
        'shots absorbed',
        'significant strikes absorbed',
        'takedowns allowed',
        'submission attempts against',
        'control time lost',
        'time spent defending'
    ];
    
    return lowerBetterStats.some(stat => 
        statName.toLowerCase().includes(stat.toLowerCase())
    );
}

function displayCommonStats(athlete1, athlete2) {
    const commonStats = {};
    
    // Compare record data
    if (athlete1.record && athlete2.record) {
        ['wins', 'losses', 'draws'].forEach(key => {
            if (athlete1.record[key] !== undefined && athlete2.record[key] !== undefined) {
                commonStats[`${key.charAt(0).toUpperCase() + key.slice(1)}`] = {
                    athlete1: athlete1.record[key],
                    athlete2: athlete2.record[key]
                };
            }
        });
    }

    // Compare stat cards data
    if (athlete1.stats && athlete2.stats) {
        Object.keys(athlete1.stats).forEach(key => {
            if (athlete2.stats[key] !== undefined) {
                commonStats[key] = {
                    athlete1: athlete1.stats[key],
                    athlete2: athlete2.stats[key]
                };
            }
        });
    }

    // Add opponent win streak comparison
    const athlete1WinStreak = calculateTotalOpponentWinStreak(athlete1);
    const athlete2WinStreak = calculateTotalOpponentWinStreak(athlete2);
    
    commonStats['Opponents Combined Win Streak'] = {
        athlete1: athlete1WinStreak.display,
        athlete2: athlete2WinStreak.display,
        athlete1Numeric: athlete1WinStreak.numeric,
        athlete2Numeric: athlete2WinStreak.numeric,
        athlete1Breakdown: athlete1WinStreak.breakdown,
        athlete2Breakdown: athlete2WinStreak.breakdown
    };

    const commonStatsDiv = document.getElementById('common-stats');
    const commonStatsContent = document.getElementById('common-stats-content');

    if (Object.keys(commonStats).length > 0) {
        commonStatsDiv.style.display = 'block';
        commonStatsContent.innerHTML = Object.entries(commonStats).map(([statName, values]) => {
            let val1, val2, athlete1Better, athlete2Better, isTie;
            
            // Special handling for opponent win streak comparison
            if (statName === 'Opponents Combined Win Streak') {
                val1 = values.athlete1Numeric;
                val2 = values.athlete2Numeric;
                
                // Higher opponent win streak total is better (faced tougher competition)
                athlete1Better = val1 > val2;
                athlete2Better = val2 > val1;
                isTie = val1 === val2;
                
                // Create detailed breakdown tooltip
                const breakdown1 = values.athlete1Breakdown.join(' + ') + ` = ${val1}`;
                const breakdown2 = values.athlete2Breakdown.join(' + ') + ` = ${val2}`;
                
                return `
                    <div class="common-comparison opponent-winstreak-comparison">
                        <div class="comparison-value ${athlete1Better ? 'winner' : isTie ? 'tie' : ''}" style="text-align: left;">
                            <span class="athlete-name-small">${selectedAthletes[0].name}</span>
                            <span class="stat-value" title="Breakdown: ${breakdown1}">${values.athlete1}</span>
                            ${athlete1Better ? '<span class="winner-badge">🏆</span>' : ''}
                        </div>
                        <div class="comparison-stat-name" style="text-align: center; font-weight: 500; color: #4a5568;">
                            ${statName}
                            <div class="stat-explanation">Higher = Faced Tougher Competition</div>
                        </div>
                        <div class="comparison-value ${athlete2Better ? 'winner' : isTie ? 'tie' : ''}" style="text-align: right;">
                            <span class="athlete-name-small">${selectedAthletes[1].name}</span>
                            <span class="stat-value" title="Breakdown: ${breakdown2}">${values.athlete2}</span>
                            ${athlete2Better ? '<span class="winner-badge">🏆</span>' : ''}
                        </div>
                    </div>
                `;
            } else {
                // Regular stat comparison logic
                val1 = parseNumericValue(values.athlete1);
                val2 = parseNumericValue(values.athlete2);
                
                // Determine which value is better based on the stat type
                if (isLowerBetterStat(statName)) {
                    athlete1Better = val1 < val2;
                    athlete2Better = val2 < val1;
                } else {
                    athlete1Better = val1 > val2;
                    athlete2Better = val2 > val1;
                }
                
                isTie = val1 === val2;
                
                return `
                    <div class="common-comparison">
                        <div class="comparison-value ${athlete1Better ? 'winner' : isTie ? 'tie' : ''}" style="text-align: left;">
                            <span class="athlete-name-small">${selectedAthletes[0].name}</span>
                            <span class="stat-value">${values.athlete1}</span>
                            ${athlete1Better ? '<span class="winner-badge">🏆</span>' : ''}
                        </div>
                        <div class="comparison-stat-name" style="text-align: center; font-weight: 500; color: #4a5568;">
                            ${statName}
                        </div>
                        <div class="comparison-value ${athlete2Better ? 'winner' : isTie ? 'tie' : ''}" style="text-align: right;">
                            <span class="athlete-name-small">${selectedAthletes[1].name}</span>
                            <span class="stat-value">${values.athlete2}</span>
                            ${athlete2Better ? '<span class="winner-badge">🏆</span>' : ''}
                        </div>
                    </div>
                `;
            }
        }).join('');
    } else {
        commonStatsDiv.style.display = 'none';
    }
}

function parseNumericValue(value) {
    // Handle different types of values (numbers, percentages, win streaks, etc.)
    if (typeof value === 'number') return value;
    
    const str = String(value).toLowerCase();
    
    // Extract numbers from strings like "15-0", "78%", "3 finishes", etc.
    const numMatch = str.match(/(\d+(?:\.\d+)?)/);
    if (numMatch) {
        return parseFloat(numMatch[1]);
    }
    
    return 0;
}

function displayAthleteAllStats(containerId, athlete) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Display record data
    if (athlete.record && Object.keys(athlete.record).length > 0) {
        const { wins = 0, losses = 0, draws = 0 } = athlete.record;
        const recordLi = document.createElement('li');
        recordLi.className = 'stat-item record-stat';
        recordLi.innerHTML = `
            <span class="stat-name">Fight Record</span>
            <span class="stat-number">${wins}W - ${losses}L${draws > 0 ? ` - ${draws}D` : ''}</span>
        `;
        container.appendChild(recordLi);
    }

    // Display opponent win streak data
    const winStreakData = calculateTotalOpponentWinStreak(athlete);
    const winStreakLi = document.createElement('li');
    winStreakLi.className = 'stat-item opponent-winstreak-stat';
    winStreakLi.innerHTML = `
        <span class="stat-name">Opponents Combined Win Streak</span>
        <span class="stat-number" title="Breakdown: ${winStreakData.breakdown.join(' + ')} = ${winStreakData.numeric}">${winStreakData.display}</span>
    `;
    container.appendChild(winStreakLi);

    // Display stats data
    if (athlete.stats && Object.keys(athlete.stats).length > 0) {
        Object.entries(athlete.stats).forEach(([statName, value]) => {
            const li = document.createElement('li');
            li.className = 'stat-item';
            li.innerHTML = `
                <span class="stat-name">${statName}</span>
                <span class="stat-number">${value}</span>
            `;
            container.appendChild(li);
        });
    }

    // Add additional info if available
    if (athlete.nationality) {
        const nationalityLi = document.createElement('li');
        nationalityLi.className = 'stat-item info-stat';
        nationalityLi.innerHTML = `
            <span class="stat-name">Nationality</span>
            <span class="stat-number">${athlete.nationality}</span>
        `;
        container.appendChild(nationalityLi);
    }

    if (athlete.nickname) {
        const nicknameLi = document.createElement('li');
        nicknameLi.className = 'stat-item info-stat';
        nicknameLi.innerHTML = `
            <span class="stat-name">Nickname</span>
            <span class="stat-number">${athlete.nickname}</span>
        `;
        container.appendChild(nicknameLi);
    }

    // Show message if no stats available (excluding the win streak we always add)
    if (container.children.length === 1) { // Only the win streak stat is present
        const noStatsLi = document.createElement('li');
        noStatsLi.className = 'stat-item no-stats';
        noStatsLi.innerHTML = `
            <span class="stat-name">Additional statistics not available</span>
            <span class="stat-number">-</span>
        `;
        container.appendChild(noStatsLi);
    }
}

function resetComparison() {
    selectedAthletes = [];
    document.querySelectorAll('.athlete-card').forEach(card => card.classList.remove('selected'));
    updateComparisonDisplay();
    displayMessage('Comparison reset. Select two athletes to compare.', 'info');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAthletes();
    
    // Add some styling for the enhanced comparison
    const style = document.createElement('style');
    style.textContent = `
        .athlete-card-nickname {
            font-style: italic;
            color: #666;
            font-size: 0.9em;
            margin: 2px 0;
        }
        
        .athlete-card-nationality {
            font-size: 0.85em;
            color: #888;
            margin: 2px 0;
        }
        
        .comparison-value {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .comparison-value.winner {
            font-weight: bold;
            color: #38a169;
        }
        
        .comparison-value.tie {
            color: #718096;
        }
        
        .athlete-name-small {
            font-size: 0.8em;
            font-weight: 500;
            color: #4a5568;
        }
        
        .stat-value {
            font-size: 1.1em;
            font-weight: 600;
            cursor: help;
        }
        
        .winner-badge {
            font-size: 0.8em;
        }
        
        .record-stat {
            border-left: 3px solid #4299e1;
            padding-left: 8px;
        }
        
        .opponent-winstreak-stat {
            border-left: 3px solid #f6ad55;
            padding-left: 8px;
            background: rgba(246, 173, 85, 0.1);
        }
        
        .info-stat {
            opacity: 0.8;
        }
        
        .no-stats {
            font-style: italic;
            color: #999;
        }
        
        .common-comparison {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 15px;
            align-items: center;
            padding: 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 10px;
            background: #f8fafc;
        }
        
        .opponent-winstreak-comparison {
            border-left: 4px solid #f6ad55;
            background: linear-gradient(135deg, #fff5f5 0%, #f7fafc 100%);
        }
        
        .comparison-stat-name {
            font-weight: 600;
            color: #2d3748;
            padding: 8px 16px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        
        .stat-explanation {
            font-size: 0.75em;
            color: #718096;
            font-weight: 400;
            margin-top: 2px;
        }
        
        /* Athlete header image styling */
        .athlete-image-container {
            display: flex;
            justify-content: center;
            margin: 15px 0;
            padding: 12px;
            background: #f7fafc;
            border-radius: 12px;
            border: 2px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .athlete-header-image {
            width: 180px;
            height: 180px;
            object-fit: contain;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid #edf2f7;
            background: #f7fafc;
        }
        
        /* Responsive adjustments for smaller screens */
        @media (max-width: 768px) {
            .athlete-header-image {
                width: 100px;
                height: 100px;
            }
            
            .athlete-image-container {
                padding: 8px;
                margin: 10px 0;
            }
        }
    `;
    document.head.appendChild(style);
});