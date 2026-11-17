(() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    const API_CONFIG = {
        baseUrl: 'https://openapi.bukaolshop.net/v1/user/transaksi',
        token: 'eyJhcHAiOiI1ODExNyIsImF1dGgiOiIyMDIxMDIwMiIsInNpZ24iOiJHWjRlRDB5S0c1aFUyUGhRUjNob2pBPT0ifQ==',
        tokenUser: '{{token_user}}',
        idUser: '{{id_user}}'
    };

    let activeTrxFilter = 'SEMUA';
    let transactionImagesVisible = true;
    let transactions = [];
    let transactionsLoaded = false;
    let poinVisible = false;
    let toastTimer;

    function showToast(message) {
        let toast = $('#toast-box');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-box';
            toast.className = 'fixed left-1/2 -translate-x-1/2 z-[100] text-white text-sm font-medium';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.style.opacity = '1';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.classList.add('hidden'), 220);
        }, 2500);
    }

    function openNavDrawer() {
        $('#nav-drawer')?.classList.add('open');
        $('#nav-drawer')?.setAttribute('aria-hidden', 'false');
        $('#nav-drawer-overlay')?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeNavDrawer() {
        $('#nav-drawer')?.classList.remove('open');
        $('#nav-drawer')?.setAttribute('aria-hidden', 'true');
        $('#nav-drawer-overlay')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    function enableDrawerSwipeToClose() {
        const panel = $('#nav-drawer > div');
        if (!panel) return;

        let startX = 0;
        let startY = 0;
        let horizontalSwipe = false;

        panel.addEventListener('touchstart', event => {
            const touch = event.changedTouches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            horizontalSwipe = false;
        }, { passive: true });

        panel.addEventListener('touchmove', event => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            if (!horizontalSwipe && Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                horizontalSwipe = true;
                panel.classList.add('is-dragging');
            }
            if (horizontalSwipe && deltaX < 0) {
                panel.style.transform = `translateX(${deltaX}px)`;
            }
        }, { passive: true });

        const finishSwipe = event => {
            if (!horizontalSwipe) return;
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - startX;
            panel.classList.remove('is-dragging');
            if (deltaX < -Math.max(70, panel.clientWidth * 0.25)) {
                panel.style.transform = '';
                closeNavDrawer();
            } else {
                panel.style.transform = '';
            }
            horizontalSwipe = false;
        };

        panel.addEventListener('touchend', finishSwipe, { passive: true });
        panel.addEventListener('touchcancel', finishSwipe, { passive: true });
    }

    function handleDrawerAction(item, action) {
        $$('.drawer-menu-item').forEach(button => button.classList.toggle('active', button.dataset.drawerItem === item));
        closeNavDrawer();
        if (typeof action === 'function') action();
    }

    function switchTab(tab) {
        const page = $(`#page-${tab}`);
        if (!page) return;
        $$('.page-view').forEach(view => view.classList.add('hidden'));
        page.classList.remove('hidden');
        $$('.nav-btn').forEach(button => {
            const selected = button.dataset.nav === tab;
            button.classList.remove('text-[#1A7F72]');
            button.classList.toggle('text-[#0D6E6E]', selected);
            button.classList.toggle('text-gray-500', !selected);
            button.setAttribute('aria-current', selected ? 'page' : 'false');
        });
        closeNavDrawer();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (tab === 'transaksi') renderTransactions();
        if (tab === 'informasi') renderNotifications();
    }

    function openPPOBGuide() {
        switchTab('informasi');
        switchInfoTab('INFORMASI');
    }

    function switchInfoTab(tab) {
        const notifications = tab === 'PEMBERITAHUAN';
        $('#info-content-pemberitahuan')?.classList.toggle('hidden', !notifications);
        $('#info-content-informasi')?.classList.toggle('hidden', notifications);
        const notificationTab = $('#tab-info-pemberitahuan');
        const informationTab = $('#tab-info-informasi');
        notificationTab?.classList.toggle('text-[#E6C838]', notifications);
        notificationTab?.classList.toggle('border-[#E6C838]', notifications);
        notificationTab?.classList.toggle('text-white/85', !notifications);
        notificationTab?.classList.toggle('border-transparent', !notifications);
        informationTab?.classList.toggle('text-[#E6C838]', !notifications);
        informationTab?.classList.toggle('border-[#E6C838]', !notifications);
        informationTab?.classList.toggle('text-white/85', notifications);
        informationTab?.classList.toggle('border-transparent', notifications);
    }

    function renderNotifications() {
        const list = $('#info-content-pemberitahuan');
        if (list && !list.dataset.rendered) {
            list.innerHTML = `
                <section class="mx-3 my-4 rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm" aria-label="Arahan pemberitahuan">
                    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]" aria-hidden="true">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
                        </svg>
                    </div>
                    <h2 class="mt-3 text-sm font-bold text-gray-800">Belum ada pemberitahuan baru</h2>
                    <p class="mt-1 text-xs leading-relaxed text-gray-500">Untuk membuat atau mengatur notifikasi, buka profil akun lalu lengkapi pengaturan pemberitahuan.</p>
                    <a href="https://pupucelluler.olshopku.com/akun/?page=profil" class="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300" aria-label="Buka profil untuk membuat notifikasi">
                        Buka Notifikasi <span aria-hidden="true">&rarr;</span>
                    </a>
                </section>`;
            list.dataset.rendered = 'true';
        }
    }

    function formatSaldoRupiah() {
        const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        });

        ['home-saldo-display', 'rekap-saldo-display', 'akun-saldo-display'].forEach(id => {
            const element = $(`#${id}`);
            const raw = element?.textContent?.trim();
            if (!raw || /{{.*}}/.test(raw)) return;

            const amount = Number(raw.replace(/[^\d-]/g, ''));
            if (Number.isFinite(amount)) element.textContent = formatter.format(amount);
        });
    }

    function togglePoinBalance() {
        poinVisible = !poinVisible;
        const element = $('#poin-saldo-text');
        if (element) element.textContent = poinVisible ? '{{point_member}}' : 'Rp ******';
    }

    function toggleSearchTrx() {
        const bar = $('#trx-search-bar');
        bar?.classList.toggle('hidden');
        if (!bar?.classList.contains('hidden')) $('#trx-search-input')?.focus();
        else clearSearchTrx();
    }

    function clearSearchTrx() {
        const input = $('#trx-search-input');
        if (input) input.value = '';
        renderTransactions();
    }

    function toggleTransactionMenu(forceOpen) {
        const menu = $('#trx-more-menu');
        const button = $('#trx-more-button');
        if (!menu || !button) return;
        const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !shouldOpen);
        menu.setAttribute('aria-hidden', String(!shouldOpen));
        button.setAttribute('aria-expanded', String(shouldOpen));
    }

    function setTransactionImagesVisible(visible) {
        transactionImagesVisible = Boolean(visible);
        toggleTransactionMenu(false);
        renderTransactions();
    }

    function getTransactionImageUrl(item) {
        const keys = ['gambar_produk', 'foto_produk', 'product_image', 'image_url', 'url_gambar', 'gambar_barang', 'foto_barang', 'thumbnail_url', 'thumbnail', 'gambar', 'foto', 'image'];
        const sources = [item, item?.produk, item?.barang, item?.product];
        for (const source of sources) {
            for (const key of keys) {
                const value = source?.[key];
                const url = typeof value === 'string' ? value : value?.url || value?.src || '';
                if (typeof url === 'string' && /^https?:\/\//i.test(url.trim())) return url.trim();
            }
        }
        return '';
    }

    function filterTrxTab(status) {
        activeTrxFilter = status;
        $$('.trx-tab-btn').forEach(button => {
            const selected = button.dataset.trxTab === status;
            button.classList.toggle('text-[#E6C838]', selected);
            button.classList.toggle('border-[#E6C838]', selected);
            button.classList.toggle('text-white/85', !selected);
            button.classList.toggle('border-transparent', !selected);
        });
        renderTransactions();
    }

    function getTransactionField(item, keys, fallback = '-') {
        for (const key of keys) {
            if (item?.[key] !== undefined && item[key] !== null && String(item[key]).trim() !== '') return String(item[key]);
        }
        return fallback;
    }

    function getTransactionStatus(item) {
        const status = getTransactionField(item, ['status', 'status_pengiriman', 'keterangan', 'state'], '').toLowerCase();
        if (status.includes('komplain') || status.includes('complain')) return 'DIKOMPLAIN';
        if (['selesai', 'lunas', 'dikirim', 'di kirim', 'success', 'berhasil'].some(value => status.includes(value))) return 'SUKSES';
        if (['batal', 'gagal', 'failed', 'cancel'].some(value => status.includes(value))) return 'GAGAL';
        if (['proses', 'pending', 'menunggu'].some(value => status.includes(value))) return 'PROSES';
        return 'PROSES';
    }

    function transactionDate(item) {
        const raw = getTransactionField(item, ['tanggal', 'created_at', 'date', 'waktu'], '');
        if (!raw) return '-';
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? raw : date.toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    function normalizeTransactions(response) {
        if (Array.isArray(response)) return response;
        const candidates = [
            response?.data,
            response?.result,
            response?.transaksi,
            response?.data_transaksi,
            response?.data?.data,
            response?.data?.result,
            response?.data?.transaksi
        ];
        return candidates.find(Array.isArray) || [];
    }

    async function loadTransactions() {
        const list = $('#transaction-list');
        if (!list) return;
        list.innerHTML = '<div class="px-4 py-10 text-center text-sm text-gray-500">Memuat transaksi...</div>';
        transactionsLoaded = false;
        transactions = [];

        if ([API_CONFIG.tokenUser, API_CONFIG.idUser].some(value => !value || /{{.*}}/.test(value))) {
            transactionsLoaded = true;
            list.innerHTML = `
                <div class="mx-4 my-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div class="flex items-start gap-3">
                        <svg class="mt-0.5 h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 11v5m0-8h.01"/>
                        </svg>
                        <div>
                            <p class="text-sm font-semibold text-blue-900">Informasi transaksi</p>
                            <p class="mt-1 text-xs leading-relaxed text-blue-800">Riwayat transaksi akan tampil saat halaman dibuka melalui aplikasi setelah login.</p>
                        </div>
                    </div>
                </div>`;
            return;
        }

        try {
            for (let page = 1; page <= 50; page++) {
                const params = new URLSearchParams({
                    token: API_CONFIG.token,
                    token_user: API_CONFIG.tokenUser,
                    id_user: API_CONFIG.idUser,
                    page: String(page)
                });
                const response = await fetch(`${API_CONFIG.baseUrl}?${params.toString()}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const json = await response.json();
                if (json?.code && Number(json.code) >= 400) {
                    throw new Error(json.message || json.pesan || `API mengembalikan kode ${json.code}`);
                }

                const pageData = normalizeTransactions(json);
                transactions.push(...pageData);
                if (pageData.length === 0) break;
            }

            transactionsLoaded = true;
            renderTransactions();
        } catch (error) {
            console.error('Gagal memuat transaksi:', error);
            transactionsLoaded = true;
            list.innerHTML = '<div class="px-4 py-10 text-center text-sm text-red-500">Gagal memuat data transaksi. Pastikan token_user dan id_user valid serta API dapat diakses.</div>';
        }
    }

    function renderTransactions() {
        const list = $('#transaction-list');
        if (!list) return;
        const query = ($('#trx-search-input')?.value || '').trim().toLowerCase();
        const filtered = transactions.filter(item => {
            const status = getTransactionStatus(item);
            if (activeTrxFilter !== 'SEMUA' && status !== activeTrxFilter) return false;
            const searchable = [
                getTransactionField(item, ['nama_barang', 'nama_produk', 'product_name', 'nama'], ''),
                getTransactionField(item, ['nomor_pembayaran', 'ref_id', 'id_transaksi', 'invoice_id', 'nomor_tujuan', 'tujuan'], ''),
                getTransactionField(item, ['status', 'status_pengiriman', 'keterangan', 'state'], '')
            ].join(' ').toLowerCase();
            return !query || searchable.includes(query);
        });

        if (!filtered.length) {
            const message = transactionsLoaded
                ? (transactions.length ? 'Tidak ada transaksi yang sesuai dengan filter.' : 'Belum ada data transaksi.')
                : 'Memuat transaksi...';
            list.innerHTML = `<div class="px-4 py-10 text-center text-sm text-gray-500">${message}</div>`;
            return;
        }

        list.replaceChildren();
        filtered.forEach(item => {
            const status = getTransactionStatus(item);
            const statusStyle = status === 'SUKSES'
                ? 'bg-green-50 text-green-700'
                : status === 'GAGAL'
                    ? 'bg-red-50 text-red-600'
                    : status === 'DIKOMPLAIN'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-purple-50 text-purple-700';
            const product = getTransactionField(item, ['nama_barang', 'nama_produk', 'product_name', 'nama'], 'Transaksi');
            const reference = getTransactionField(item, ['nomor_pembayaran', 'ref_id', 'id_transaksi', 'invoice_id'], '-');
            const destination = getTransactionField(item, ['nomor_tujuan', 'tujuan', 'nomor_hp', 'customer_no'], '');
            const amount = getTransactionField(item, ['total_bayar', 'harga', 'nominal', 'jumlah'], '');
            const imageUrl = getTransactionImageUrl(item);
            const card = document.createElement('article');
            card.className = 'flex items-start justify-between gap-3 px-4 py-4 bg-white';

            if (transactionImagesVisible && imageUrl && imageUrl !== '-' && /^https?:\/\//i.test(imageUrl)) {
                const image = document.createElement('img');
                image.src = imageUrl;
                image.alt = '';
                image.loading = 'lazy';
                image.className = 'h-11 w-11 shrink-0 rounded-lg object-cover';
                image.addEventListener('error', () => image.remove(), { once: true });
                card.appendChild(image);
            }

            const details = document.createElement('div');
            details.className = 'min-w-0 flex-1';
            const date = document.createElement('p');
            date.className = 'text-[11px] text-gray-400 mb-1';
            date.textContent = transactionDate(item);
            const name = document.createElement('p');
            name.className = 'text-[13px] font-bold text-gray-800';
            name.textContent = product;
            const meta = document.createElement('p');
            meta.className = 'text-[11px] text-gray-500 mt-1 break-words';
            meta.textContent = [destination, `ID: ${reference}`, amount].filter(Boolean).join(' · ');
            details.append(date, name, meta);

            const badge = document.createElement('span');
            badge.className = `shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${statusStyle}`;
            badge.textContent = status;
            card.append(details, badge);

            const link = getTransactionField(item, ['link_transaksi', 'link'], '');
            if (link && link !== '-') {
                card.classList.add('cursor-pointer', 'active:bg-gray-50');
                card.addEventListener('click', () => window.open(link, '_blank', 'noopener,noreferrer'));
            }
            list.appendChild(card);
        });
    }

    function switchAccountTab(tab) {
        const menu = tab === 'MENU';
        $('#akun-content-menu')?.classList.toggle('hidden', !menu);
        $('#akun-content-profil')?.classList.toggle('hidden', menu);
        const menuTab = $('#tab-akun-menu');
        const profileTab = $('#tab-akun-profil');
        menuTab?.classList.remove('text-[#1A7F72]', 'border-[#1A7F72]');
        profileTab?.classList.remove('text-[#1A7F72]', 'border-[#1A7F72]');
        menuTab?.classList.toggle('text-[#1A7F72]', menu);
        menuTab?.classList.toggle('border-[#1A7F72]', menu);
        menuTab?.classList.toggle('text-gray-500', !menu);
        menuTab?.classList.toggle('border-transparent', !menu);
        profileTab?.classList.toggle('text-[#1A7F72]', !menu);
        profileTab?.classList.toggle('border-[#1A7F72]', !menu);
        profileTab?.classList.toggle('text-gray-500', menu);
        profileTab?.classList.toggle('border-transparent', menu);
    }

    function copyUsername() {
        const username = $('#akun-content-profil .font-semibold')?.textContent?.trim() || 'pupucelluler';
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(username).then(() => showToast('Username berhasil disalin.')).catch(() => showToast(`Username: ${username}`));
        } else {
            showToast(`Username: ${username}`);
        }
    }

    // Ignore the placeholder onclick="#" handlers without interrupting the app.
    document.addEventListener('click', event => {
        const placeholder = event.target.closest('[onclick="#"]');
        if (!placeholder) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        showToast('Fitur ini belum tersedia.');
    }, true);

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeNavDrawer();
            toggleTransactionMenu(false);
        }
    });

    document.addEventListener('click', event => {
        if (!event.target.closest('#trx-more-button, #trx-more-menu')) toggleTransactionMenu(false);
    });

    document.addEventListener('DOMContentLoaded', () => {
        enableDrawerSwipeToClose();
        formatSaldoRupiah();
        loadTransactions();
        renderNotifications();
        switchTab('home');
        switchInfoTab('PEMBERITAHUAN');
        switchAccountTab('MENU');
    });

    Object.assign(window, {
        showToast, openNavDrawer, closeNavDrawer, handleDrawerAction, switchTab, switchInfoTab, openPPOBGuide,
        togglePoinBalance, toggleSearchTrx, clearSearchTrx, filterTrxTab, renderTransactions,
        toggleTransactionMenu, setTransactionImagesVisible, switchAccountTab, copyUsername
    });
})();
