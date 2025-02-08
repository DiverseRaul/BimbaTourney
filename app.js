// Initialize State object first, before any other code
window.State = {
    tournaments: [],
    saveTournaments: function() {
        try {
            localStorage.setItem('tournaments', JSON.stringify(this.tournaments));
        } catch (e) {
            console.error('Error saving tournaments:', e);
        }
    },
    loadTournaments: function() {
        try {
            const saved = localStorage.getItem('tournaments');
            this.tournaments = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading tournaments:', e);
        }
    }
};

// Initialize tournaments on page load
State.loadTournaments();

// Cookie utilities
const CookieUtil = {
    setCookie(name, value, days) {
        try {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            const expires = `expires=${date.toUTCString()}`;
            document.cookie = `${name}=${JSON.stringify(value)};${expires};path=/`;
        } catch (e) {
            console.error('Error setting cookie:', e);
        }
    },

    getCookie(name) {
        try {
            const cookieName = `${name}=`;
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.indexOf(cookieName) === 0) {
                    try {
                        return JSON.parse(cookie.substring(cookieName.length));
                    } catch (e) {
                        return null;
                    }
                }
            }
            return null;
        } catch (e) {
            console.error('Error getting cookie:', e);
        }
    }
};

// State management
const stateManagement = {
    tournaments: CookieUtil.getCookie('tournaments') || [],
    friends: CookieUtil.getCookie('friends') || [],

    saveTournaments() {
        CookieUtil.setCookie('tournaments', this.tournaments, 365);
    },

    saveFriends() {
        CookieUtil.setCookie('friends', this.friends, 365);
    }
};

// Tournament management
function createTournament(name, type, playersList) {
    const tournament = {
        id: Date.now(),
        name: name || 'Untitled Tournament',
        type: type || 'knockout',
        players: Array.isArray(playersList) ? playersList : [],
        status: 'active',
        matches: [],
        createdAt: new Date().toISOString()
    };

    if (!State.tournaments) {
        State.tournaments = [];
    }

    State.tournaments.push(tournament);
    State.saveTournaments();
    renderTournaments();
}

function generateKnockoutMatches(players) {
    const matches = [];
    const shuffledPlayers = players.sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledPlayers.length - 1; i += 2) {
        matches.push({
            player1: shuffledPlayers[i],
            player2: shuffledPlayers[i + 1],
            winner: null,
            round: 1
        });
    }

    return matches;
}

function generateLeagueMatches(players) {
    const matches = [];

    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            matches.push({
                player1: players[i],
                player2: players[j],
                winner: null
            });
        }
    }

    return matches;
}

function createTournamentCard(tournament) {
    const card = document.createElement('div');
    card.className = 'tournament-card';

    const status = tournament.status || 'active';
    const statusClass = status === 'active' ? 'status-active' : 'status-completed';
    const dateCreated = new Date(tournament.createdAt).toLocaleDateString();
    const type = tournament.type || 'knockout';
    const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);

    card.innerHTML = `
        <div class="card-header">
            <h3>${tournament.name}</h3>
            <div class="card-actions">
                <button class="edit-btn" title="Edit Tournament" data-id="${tournament.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        <div class="card-content">
            <div class="tournament-info">
                <div class="badge tournament-type">
                    <div class="badge-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="badge-text">${capitalizedType}</div>
                </div>
                <div class="badge tournament-status ${statusClass}">
                    <div class="badge-icon">
                        <i class="fas fa-circle"></i>
                    </div>
                    <div class="badge-text">${statusText}</div>
                </div>
            </div>
            <div class="players-info">
                <h4><i class="fas fa-users"></i> Players (${tournament.players ? tournament.players.length : 0})</h4>
                <ul class="players-list-display">
                    ${tournament.players ? tournament.players.map((player, index) => `
                        <li style="--player-index: ${index}">
                            <i class="fas fa-user"></i>
                            <span>${player}</span>
                        </li>
                    `).join('') : ''}
                </ul>
            </div>
            <div class="card-footer">
                <span class="date-created">
                    <i class="fas fa-calendar"></i>
                    Created: ${dateCreated}
                </span>
            </div>
        </div>
    `;

    const editBtn = card.querySelector('.edit-btn');
    editBtn.onclick = () => editTournament(tournament);

    return card;
}

let globalPlayers = [];
let globalPlayersList;

function editTournament(tournament) {
    const modal = document.getElementById('tournamentModal');
    const form = document.getElementById('tournamentForm');
    const nameInput = document.getElementById('tournamentName');
    const typeInput = document.getElementById('tournamentType');
    const modalTitle = document.querySelector('.modal-header h2');
    const submitButton = form.querySelector('.cta-button');
    const deleteButton = form.querySelector('.delete-btn');
    
    // Set form to edit mode
    form.dataset.mode = 'edit';
    form.dataset.tournamentId = tournament.id;
    
    // Update modal title and buttons
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Tournament';
    submitButton.textContent = 'Save Changes';
    deleteButton.style.display = 'flex';
    
    // Setup delete button
    deleteButton.onclick = () => {
        if (confirm('Are you sure you want to delete this tournament?')) {
            State.tournaments = State.tournaments.filter(t => t.id !== tournament.id);
            State.saveTournaments();
            renderTournaments();
            modal.style.display = 'none';
            form.reset();
            globalPlayers = [];
            globalPlayersList.innerHTML = '';
            form.dataset.mode = 'create';
            delete form.dataset.tournamentId;
        }
    };
    
    // Fill in tournament details
    nameInput.value = tournament.name;
    typeInput.value = tournament.type;
    
    // Clear and refill players list
    globalPlayers = [];
    globalPlayersList.innerHTML = '';
    
    // Add existing players
    tournament.players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
            <span>${player}</span>
            <button type="button" class="remove-player-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const removeBtn = playerElement.querySelector('.remove-player-btn');
        removeBtn.onclick = () => {
            globalPlayers = globalPlayers.filter(p => p !== player);
            playerElement.remove();
        };
        
        globalPlayers.push(player);
        globalPlayersList.appendChild(playerElement);
    });
    
    modal.style.display = 'block';
}

function addFriend(name) {
    if (name && !stateManagement.friends.includes(name)) {
        stateManagement.friends.push(name);
        stateManagement.saveFriends();
        renderFriends();
    }
}

function renderFriends() {
    const friendsList = document.querySelector('.friends-list');
    friendsList.innerHTML = stateManagement.friends.map(friend => `
        <div class="friend-item">
            <span>${friend}</span>
            <button class="secondary-button" onclick="removeFriend('${friend}')">Remove</button>
        </div>
    `).join('');
}

function removeFriend(name) {
    stateManagement.friends = stateManagement.friends.filter(friend => friend !== name);
    stateManagement.saveFriends();
    renderFriends();
}

document.addEventListener('DOMContentLoaded', () => {
    // Get all required DOM elements
    const modal = document.getElementById('tournamentModal');
    const tournamentForm = document.getElementById('tournamentForm');
    const createBtn = document.getElementById('createTournamentBtn');
    const createFirstBtn = document.getElementById('createFirstTournamentBtn');
    const closeBtn = document.querySelector('.close-button');
    const playerInput = document.querySelector('.player-input');
    const addPlayerBtn = document.querySelector('.add-player-btn');
    const playersList = document.querySelector('.players-list');
    const nameInput = document.getElementById('tournamentName');
    const typeInput = document.getElementById('tournamentType');
    const deleteBtn = document.querySelector('.delete-btn');
    
    // Verify all elements exist
    if (!modal || !tournamentForm || !playerInput || !playersList || !nameInput || !typeInput) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // Set global reference
    globalPlayersList = playersList;
    
    // Initialize the view
    renderTournaments();

    function addPlayer(playerName, skipValidation = false) {
        if (!skipValidation && (!playerName || playerName.trim() === '' || globalPlayers.includes(playerName))) {
            return;
        }
        
        const playerElement = document.createElement('div');
        playerElement.className = 'player-item';
        playerElement.innerHTML = `
            <span>${playerName}</span>
            <button type="button" class="remove-player-btn">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const removeBtn = playerElement.querySelector('.remove-player-btn');
        removeBtn.onclick = () => {
            globalPlayers = globalPlayers.filter(p => p !== playerName);
            playerElement.remove();
        };
        
        if (!skipValidation) {
            globalPlayers.push(playerName);
        }
        globalPlayersList.appendChild(playerElement);
        playerInput.value = '';
        playerInput.focus();
    }

    // Handle player input
    addPlayerBtn.onclick = () => {
        const playerName = playerInput.value.trim();
        if (playerName) {
            addPlayer(playerName);
        }
    };

    playerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const playerName = playerInput.value.trim();
            if (playerName) {
                addPlayer(playerName);
            }
        }
    });

    // Form submission
    tournamentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (globalPlayers.length < 2) {
            alert('At least 2 players are required');
            return;
        }

        const name = nameInput.value.trim();
        const type = typeInput.value;
        
        if (!name) {
            alert('Tournament name is required');
            return;
        }
        
        if (tournamentForm.dataset.mode === 'edit') {
            const tournamentId = parseInt(tournamentForm.dataset.tournamentId);
            const tournamentIndex = State.tournaments.findIndex(t => t.id === tournamentId);
            
            if (tournamentIndex !== -1) {
                State.tournaments[tournamentIndex] = {
                    ...State.tournaments[tournamentIndex],
                    name: name,
                    type: type,
                    players: [...globalPlayers],
                    updatedAt: new Date().toISOString()
                };
                State.saveTournaments();
                renderTournaments();
            }
        } else {
            createTournament(name, type, [...globalPlayers]);
        }
        
        modal.style.display = 'none';
        tournamentForm.reset();
        globalPlayers = [];
        globalPlayersList.innerHTML = '';
        tournamentForm.dataset.mode = 'create';
        delete tournamentForm.dataset.tournamentId;
    });

    // Create button handlers
    if (createBtn) {
        createBtn.onclick = () => {
            const modalTitle = document.querySelector('.modal-header h2');
            const submitButton = tournamentForm.querySelector('.cta-button');
            modalTitle.innerHTML = '<i class="fas fa-trophy"></i> Create New Tournament';
            submitButton.textContent = 'Create Tournament';
            deleteBtn.style.display = 'none';
            modal.style.display = 'block';
            globalPlayers = [];
            globalPlayersList.innerHTML = '';
            tournamentForm.reset();
            tournamentForm.dataset.mode = 'create';
            delete tournamentForm.dataset.tournamentId;
        };
    }

    if (createFirstBtn) {
        createFirstBtn.onclick = () => {
            const modalTitle = document.querySelector('.modal-header h2');
            const submitButton = tournamentForm.querySelector('.cta-button');
            modalTitle.innerHTML = '<i class="fas fa-trophy"></i> Create New Tournament';
            submitButton.textContent = 'Create Tournament';
            deleteBtn.style.display = 'none';
            modal.style.display = 'block';
            globalPlayers = [];
            globalPlayersList.innerHTML = '';
            tournamentForm.reset();
            tournamentForm.dataset.mode = 'create';
            delete tournamentForm.dataset.tournamentId;
        };
    }

    // Close button and outside click
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            tournamentForm.reset();
            globalPlayers = [];
            globalPlayersList.innerHTML = '';
            tournamentForm.dataset.mode = 'create';
            delete tournamentForm.dataset.tournamentId;
            deleteBtn.style.display = 'none';
        };
    }

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            tournamentForm.reset();
            globalPlayers = [];
            globalPlayersList.innerHTML = '';
            tournamentForm.dataset.mode = 'create';
            delete tournamentForm.dataset.tournamentId;
            deleteBtn.style.display = 'none';
        }
    };
});

// Function to render tournament cards
function renderTournaments(filter = 'all') {
    const tournamentContainer = document.querySelector('.tournament-cards');
    let filteredTournaments = State.tournaments;

    if (filter !== 'all') {
        filteredTournaments = State.tournaments.filter(t => t.status.toLowerCase() === filter.toLowerCase());
    }

    const tournamentCards = filteredTournaments.map(tournament => createTournamentCard(tournament));
    tournamentContainer.innerHTML = '';
    tournamentCards.forEach(card => tournamentContainer.appendChild(card));
}

// Function to handle tournament join
function joinTournament(tournamentId) {
    // This would typically involve an API call to join the tournament
    alert(`Joining tournament ${tournamentId}! This feature will be implemented soon.`);
}

// Add smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
