// Cookie utilities
const CookieUtil = {
    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${JSON.stringify(value)};${expires};path=/`;
    },

    getCookie(name) {
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
    }
};

// State management
const State = {
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
function createTournament(name, players, type) {
    const tournament = {
        id: Date.now(),
        name,
        players: players.split(',').map(p => p.trim()),
        type,
        status: 'active',
        matches: [],
        createdAt: new Date().toISOString()
    };

    if (type === 'knockout') {
        tournament.matches = generateKnockoutMatches(tournament.players);
    } else {
        tournament.matches = generateLeagueMatches(tournament.players);
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
    return `
        <div class="tournament-card">
            <div class="tournament-status ${tournament.status}">
                <span>${tournament.status}</span>
            </div>
            <div class="tournament-info">
                <h3>${tournament.name}</h3>
                <div class="tournament-meta">
                    <span><i class="fas fa-users"></i> ${tournament.players.length} Players</span>
                    <span><i class="fas fa-trophy"></i> ${tournament.type}</span>
                </div>
            </div>
            <button class="view-button" onclick="viewTournament(${tournament.id})">
                View Details <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;
}

// Friend management
function addFriend(name) {
    if (name && !State.friends.includes(name)) {
        State.friends.push(name);
        State.saveFriends();
        renderFriends();
    }
}

function renderFriends() {
    const friendsList = document.querySelector('.friends-list');
    friendsList.innerHTML = State.friends.map(friend => `
        <div class="friend-item">
            <span>${friend}</span>
            <button class="secondary-button" onclick="removeFriend('${friend}')">Remove</button>
        </div>
    `).join('');
}

function removeFriend(name) {
    State.friends = State.friends.filter(friend => friend !== name);
    State.saveFriends();
    renderFriends();
}

// UI Event Handlers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('tournamentModal');
    const createBtn = document.getElementById('createTournamentBtn');
    const closeBtn = document.querySelector('.close');
    const tournamentForm = document.getElementById('tournamentForm');
    const addFriendForm = document.getElementById('addFriendForm');
    const filterBtns = document.querySelectorAll('.filter-btn');

    createBtn.onclick = () => modal.style.display = 'block';
    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTournaments(btn.textContent.toLowerCase());
        });
    });

    tournamentForm.onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('tournamentName').value;
        const players = document.getElementById('players').value;
        const type = document.getElementById('tournamentType').value;
        
        createTournament(name, players, type);
        modal.style.display = 'none';
        tournamentForm.reset();
    };

    addFriendForm.onsubmit = (e) => {
        e.preventDefault();
        const friendName = document.getElementById('friendName').value;
        addFriend(friendName);
        addFriendForm.reset();
    };

    renderTournaments();
    renderFriends();
});

// Function to render tournament cards
function renderTournaments(filter = 'all') {
    const tournamentContainer = document.querySelector('.tournament-cards');
    let filteredTournaments = State.tournaments;
    
    if (filter !== 'all') {
        filteredTournaments = State.tournaments.filter(t => t.status.toLowerCase() === filter.toLowerCase());
    }
    
    const tournamentCards = filteredTournaments.map(tournament => createTournamentCard(tournament)).join('');
    tournamentContainer.innerHTML = tournamentCards || '';
}

// Function to handle tournament join
function joinTournament(tournamentId) {
    // This would typically involve an API call to join the tournament
    alert(`Joining tournament ${tournamentId}! This feature will be implemented soon.`);
}

// Function to handle create tournament button
document.querySelector('.cta-button').addEventListener('click', () => {
    // This would typically open a modal or navigate to create tournament page
    alert('Create Tournament feature coming soon!');
});

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
