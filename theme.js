/* Shared theme controller for every page. */
(() => {
    const THEME_KEY = 'pupuCellTheme';
    const MODE_KEY = 'pupuCellThemeMode';
    const root = document.documentElement;
    const systemTheme = typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    function readStorage(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // The theme still applies for this page if storage is unavailable.
        }
    }

    function getEffectiveTheme() {
        if (readStorage(MODE_KEY) === 'sistem' && systemTheme) {
            return systemTheme.matches ? 'dark' : 'light';
        }
        return readStorage(THEME_KEY) === 'dark' ? 'dark' : 'light';
    }

    function updateControls(isDark) {
        document.querySelectorAll('.theme-toggle, #theme-toggle, #themeToggle').forEach(button => {
            button.setAttribute('aria-pressed', String(isDark));
            button.setAttribute('aria-label', isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
            button.setAttribute('title', isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap');
            const icon = button.querySelector('.material-icons-round');
            if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
        });
    }

    function syncSettingsMode() {
        const options = document.querySelectorAll('input[name="tampilan"]');
        if (!options.length) return;
        let mode = readStorage(MODE_KEY);
        if (!['sistem', 'terang', 'gelap'].includes(mode)) {
            mode = readStorage(THEME_KEY) === 'dark' ? 'gelap' : 'terang';
        }
        options.forEach(option => { option.checked = option.value === mode; });
    }

    function setThemeMode(mode, notify = false) {
        const selectedMode = ['sistem', 'terang', 'gelap'].includes(mode) ? mode : 'terang';
        const theme = selectedMode === 'sistem'
            ? (systemTheme && systemTheme.matches ? 'dark' : 'light')
            : (selectedMode === 'gelap' ? 'dark' : 'light');
        writeStorage(MODE_KEY, selectedMode);
        setTheme(theme);
        syncSettingsMode();
        if (notify) {
            const toast = document.getElementById('toast');
            const text = document.getElementById('toastText');
            const label = selectedMode === 'sistem' ? 'Default Sistem' : selectedMode === 'gelap' ? 'Gelap' : 'Terang';
            if (toast && text) {
                text.textContent = `Tampilan diubah ke ${label}`;
                toast.style.opacity = '1';
                clearTimeout(window.__themeToastTimer);
                window.__themeToastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
            }
        }
    }

    function initializeThemeControls() {
        document.querySelectorAll('.theme-toggle, #theme-toggle, #themeToggle').forEach(button => {
            if (!button.hasAttribute('onclick')) button.addEventListener('click', toggleTheme);
        });
        document.querySelectorAll('input[name="tampilan"]').forEach(option => {
            option.addEventListener('change', () => {
                if (option.checked) setThemeMode(option.value, true);
            });
        });
        syncSettingsMode();
    }

    window.setPupuCellThemeMode = setThemeMode;
    window.addEventListener('storage', event => {
        if (event.key === MODE_KEY) syncSettingsMode();
    });
    document.addEventListener('DOMContentLoaded', initializeThemeControls);
    if (document.readyState !== 'loading') initializeThemeControls();

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        root.dataset.theme = isDark ? 'dark' : 'light';
        const app = document.getElementById('app-frame');
        if (app) app.dataset.theme = isDark ? 'dark' : 'light';
        updateControls(isDark);
        document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
            meta.content = isDark ? '#0d1524' : '#2563eb';
        });
        return isDark ? 'dark' : 'light';
    }

    function setTheme(theme, persist = true) {
        const selected = applyTheme(theme);
        if (persist) {
            writeStorage(THEME_KEY, selected);
            writeStorage(MODE_KEY, selected === 'dark' ? 'gelap' : 'terang');
        }
        return selected;
    }

    function toggleTheme() {
        return setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    }

    window.PupuCellTheme = { apply: applyTheme, set: setTheme, toggle: toggleTheme };
    if (typeof window.toggleTheme !== 'function') window.toggleTheme = toggleTheme;

    applyTheme(getEffectiveTheme());

    document.addEventListener('DOMContentLoaded', () => {
        updateControls(root.dataset.theme === 'dark');
        syncSettingsMode();
    });

    window.addEventListener('storage', event => {
        if (event.key === THEME_KEY || event.key === MODE_KEY) {
            applyTheme(getEffectiveTheme());
        }
    });

    if (systemTheme) {
        const onSystemThemeChange = () => {
            if (readStorage(MODE_KEY) !== 'sistem') return;
            const theme = systemTheme.matches ? 'dark' : 'light';
            applyTheme(theme);
            writeStorage(THEME_KEY, theme);
            syncSettingsMode();
        };
        if (typeof systemTheme.addEventListener === 'function') {
            systemTheme.addEventListener('change', onSystemThemeChange);
        } else if (typeof systemTheme.addListener === 'function') {
            systemTheme.addListener(onSystemThemeChange);
        }
    }
})();
