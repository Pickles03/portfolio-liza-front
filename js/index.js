const themeToggle = document.getElementById('themeToggle');

if (themeToggle){
    const THEME_KEY = 'theme';

    function applyTheme(theme){
        if (theme === 'light'){
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }

    let stored;
    try{
        stored = localStorage.getItem(THEME_KEY);
    } catch (e){
        stored = null;
    }
    applyTheme(stored === 'light' ? 'light' : 'dark');

    themeToggle.addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const next = isLight ? 'dark' : 'light';
        try{
            localStorage.setItem(THEME_KEY, next);
        } catch (e){}
        applyTheme(next);
    });
}

const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = navMenu.querySelectorAll('.nav-link');

function closeMenu(){
    navMenu.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
}

menuToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen)); 
    menuToggle.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
});

navLinks.forEach(link => link.addEventListener('click', closeMenu));

window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
});

const typedWordEl = document.getElementById('typedWord');

if (typedWordEl){
    const words = ['Game Developer', 'Game Designer', 'Unity Developer', 'C# Developer (OOP)'];
    const TYPE_SPEED = 70;
    const DELETE_SPEED = 40;
    const HOLD_DELAY = 1400;
    const NEXT_DELAY = 300;

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick(){
        const currentWord = words[wordIndex];

        if (!deleting){
            charIndex++;
            typedWordEl.textContent = currentWord.slice(0, charIndex);

            if (charIndex === currentWord.length){
                deleting = true;
                setTimeout(tick, HOLD_DELAY);
                return;
            }
            setTimeout(tick, TYPE_SPEED);
        } else {
            charIndex--;
            typedWordEl.textContent = currentWord.slice(0, charIndex);

            if (charIndex === 0){
                deleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                setTimeout(tick, NEXT_DELAY);
                return;
            }
            setTimeout(tick, DELETE_SPEED);
        }
    }

    tick();
}

const revealEls = document.querySelectorAll('.reveal');

if (revealEls.length){
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting){
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealEls.forEach(el => revealObserver.observe(el));
}

const timelineContents = document.querySelectorAll('.timeline-content');

if (timelineContents.length){
    const focusObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target.classList.toggle('in-focus', entry.isIntersecting);
        });
    }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

    timelineContents.forEach(el => focusObserver.observe(el));
}

document.querySelectorAll('.details-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (panel) panel.classList.toggle('open', !expanded);
    });
});

document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.dot');
    const AUTO_DELAY = 4000;
    let index = 0;
    let timer = null;

    function goTo(target){
        index = (target + slides.length) % slides.length;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
    }

    function startAuto(){
        stopAuto();
        timer = setInterval(() => goTo(index + 1), AUTO_DELAY);
    }

    function stopAuto(){
        if (timer) clearInterval(timer);
    }

    carousel.querySelector('.next').addEventListener('click', () => { goTo(index + 1); startAuto(); });
    carousel.querySelector('.prev').addEventListener('click', () => { goTo(index - 1); startAuto(); });
    dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => { goTo(dotIndex); startAuto(); }));
    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);

    startAuto();
});

function initSpotlight(scrollId, stageId, progressId, hintId){
    const scrollEl = document.getElementById(scrollId);
    const stageEl = document.getElementById(stageId);
    const progressEl = progressId ? document.getElementById(progressId) : null;
    const hintEl = hintId ? document.getElementById(hintId) : null;
    if (!scrollEl || !stageEl) return;

    const panels = Array.from(stageEl.querySelectorAll(':scope > .spotlight-panel'));
    if (!panels.length) return;

    const mq = window.matchMedia('(min-width: 768px)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let active = false;
    let ticking = false;
    let closestPanelCenter = 0;
    let snapTimer = null;

    function activate(){
        active = true;
        scrollEl.classList.add('spotlight-active');
        scrollEl.style.setProperty('--panel-count', panels.length);
        if (hintEl) hintEl.style.display = 'block';
    }

    function deactivate(){
        active = false;
        clearTimeout(snapTimer);
        scrollEl.classList.remove('spotlight-active');
        if (hintEl) hintEl.style.display = 'none';
        panels.forEach(panel => {
            panel.style.opacity = '';
            panel.style.transform = '';
            panel.style.filter = '';
            panel.style.pointerEvents = '';
        });
    }

    function update(){
        if (!active) return;

        const rect = scrollEl.getBoundingClientRect();
        const vh = window.innerHeight;
        const focusY = vh / 2 - rect.top;
        const slot = rect.height / panels.length;

        let closestIndex = 0;
        let closestDistance = Infinity;

        panels.forEach((panel, i) => {
            const panelCenter = (i + 0.5) * slot;
            let progress = (panelCenter - focusY) / vh;
            progress = Math.max(-1.6, Math.min(1.6, progress));
            const absProgress = Math.abs(progress);

            if (absProgress < closestDistance){
                closestDistance = absProgress;
                closestIndex = i;
                closestPanelCenter = panelCenter;
            }

            const opacity = Math.max(0, 1 - absProgress * 1.15);
            const scale = 1 - Math.min(absProgress, 1) * 0.16;
            const blur = Math.min(absProgress, 1) * 6;
            const translateY = progress * 70;

            panel.style.opacity = opacity.toFixed(3);
            panel.style.transform = `translateY(${translateY.toFixed(1)}px) scale(${scale.toFixed(3)})`;
            panel.style.filter = `blur(${blur.toFixed(2)}px)`;
            panel.style.pointerEvents = absProgress < 0.5 ? 'auto' : 'none';
        });

        if (progressEl) progressEl.textContent = `${closestIndex + 1} / ${panels.length}`;
    }

    function layout(){
        if (mq.matches){
            if (!active) activate();
            update();
        } else if (active){
            deactivate();
        }
    }

    function snapToClosest(){
        if (!active) return;

        const rect = scrollEl.getBoundingClientRect();
        const vh = window.innerHeight;
        const pinned = rect.top <= 0 && rect.bottom >= vh;
        if (!pinned) return;

        const focusY = vh / 2 - rect.top;
        const delta = closestPanelCenter - focusY;
        if (Math.abs(delta) < 2) return;

        window.scrollTo({
            top: window.scrollY + delta,
            behavior: reduceMotion.matches ? 'auto' : 'smooth'
        });
    }

    function scheduleSnap(){
        clearTimeout(snapTimer);
        snapTimer = setTimeout(snapToClosest, 160);
    }

    function onScroll(){
        if (!ticking){
            ticking = true;
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
        }
        if (active) scheduleSnap();
    }

    mq.addEventListener('change', layout);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', layout);

    layout();
}

initSpotlight('projectsScroll', 'projectsStage', 'projectsProgress', 'projectsHint');
initSpotlight('experienceScroll', 'experienceStage', 'experienceProgress', 'experienceHint');
initSpotlight('educationScroll', 'educationStage', 'educationProgress', 'educationHint');
