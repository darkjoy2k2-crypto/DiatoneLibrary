// Authentication module — password is stored as SHA-256 hash only
// The plaintext password is never present in this codebase.

const AUTH_HASH = '49ed427df8516d7f3ea58049e9059841f80b8cc8fd797e19dbb372f34fa39f36';
const AUTH_SESSION_KEY = 'dl-auth-token';

// ── Helpers ────────────────────────────────────────────────────────────────

async function _sha256hex(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function _generateSessionToken() {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Public API ─────────────────────────────────────────────────────────────

function isAuthenticated() {
    return sessionStorage.getItem(AUTH_SESSION_KEY) !== null;
}

async function verifyAndLogin(password) {
    const hash = await _sha256hex(password);
    if (hash === AUTH_HASH) {
        sessionStorage.setItem(AUTH_SESSION_KEY, _generateSessionToken());
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    location.reload();
}

// ── Login UI ───────────────────────────────────────────────────────────────

function _showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
}

function _showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
}

function _attachLoginListeners() {
    const btn = document.getElementById('login-btn');
    const input = document.getElementById('login-password');

    async function attempt() {
        const pw = input.value;
        if (!pw) return;
        const ok = await verifyAndLogin(pw);
        if (ok) {
            _showApp();
        } else {
            input.value = '';
            _showLoginError('Falsches Passwort');
            input.focus();
        }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attempt();
        // Clear error on new input
        if (e.key !== 'Enter') {
            document.getElementById('login-error').textContent = '';
        }
    });

    const showBtn = document.getElementById('login-show-pw');
    showBtn.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        showBtn.style.opacity = isHidden ? '1' : '0.5';
    });

    input.focus();
}

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        _showApp();
    } else {
        _attachLoginListeners();
    }
});
