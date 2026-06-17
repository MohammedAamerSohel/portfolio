document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // Register GSAP Plugins
    // ==========================================================================
    gsap.registerPlugin(ScrollTrigger);

    // ==========================================================================
    // Lenis Smooth Scroll Setup
    // ==========================================================================
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time)=>{
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);

    // ==========================================================================
    // Loader Logic
    // ==========================================================================
    const loaderPercentage = document.querySelector('.loader-percentage');
    const loaderBar = document.querySelector('.loader-bar');
    let percent = 0;
    
    // Animate Logo text
    gsap.to(".loader-logo", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out"
    });

    const loaderInterval = setInterval(() => {
        percent += Math.floor(Math.random() * 10) + 1;
        if (percent > 100) percent = 100;
        
        loaderPercentage.textContent = percent + '%';
        loaderBar.style.width = percent + '%';

        if (percent === 100) {
            clearInterval(loaderInterval);
            finishLoading();
        }
    }, 150);

    function finishLoading() {
        const tl = gsap.timeline();
        tl.to(".loader-content", {
            opacity: 0,
            y: -20,
            duration: 0.5,
            ease: "power2.in",
            delay: 0.2
        })
        .to(".loader-wrapper", {
            yPercent: -100,
            duration: 0.8,
            ease: "power4.inOut"
        })
        .from(".hero-title", {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, "-=0.3")
        .from(".hero-description", {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.6")
        .from(".hero-buttons", {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.6")
        .from(".hero-social .social-icon", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)"
        }, "-=0.6")
        .from(".hero-image-wrapper", {
            x: 50,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out"
        }, "-=1")
        .from(".header", {
            y: -100,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=1");

        // Initialize Typed.js after loader finishes
        setTimeout(initTyped, 800);
    }

    // ==========================================================================
    // Custom Cursor
    // ==========================================================================
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Hover effect for links and buttons
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, .tilt-element');
    
    interactiveElements.forEach((el) => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.style.width = '60px';
            cursorOutline.style.height = '60px';
            cursorOutline.style.backgroundColor = 'rgba(255,255,255,0.1)';
        });
        el.addEventListener('mouseleave', () => {
            cursorOutline.style.width = '40px';
            cursorOutline.style.height = '40px';
            cursorOutline.style.backgroundColor = 'transparent';
        });
    });

    // ==========================================================================
    // Typed.js Setup
    // ==========================================================================
    function initTyped() {
        if(document.getElementById('typing-element')) {
            new Typed('#typing-element', {
                strings: ['AI Technology.', 'Creative Strategy.', 'Prompt Engineering.', 'Instagram Growth.'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true,
                showCursor: true,
                cursorChar: '|'
            });
        }
    }

    // ==========================================================================
    // Vanilla Tilt for 3D Cards
    // ==========================================================================
    VanillaTilt.init(document.querySelectorAll(".tilt-element"), {
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.2,
        scale: 1.02
    });

    // ==========================================================================
    // Scroll Progress Bar
    // ==========================================================================
    const progressBar = document.querySelector('.progress-bar');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });

    // ==========================================================================
    // Navbar Scroll Effect & Mobile Menu
    // ==========================================================================
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav-list');
    
    if(navToggle) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            const icon = navToggle.querySelector('i');
            if(navList.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu on click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('active');
            const icon = navToggle.querySelector('i');
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        });
    });

    // ==========================================================================
    // GSAP Scroll Animations
    // ==========================================================================

    // Text Reveal effect
    const revealTexts = document.querySelectorAll('.reveal-text');
    revealTexts.forEach((text) => {
        gsap.from(text, {
            scrollTrigger: {
                trigger: text,
                start: "top 85%",
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        });
    });

    // Reveal Up effect for cards and blocks
    const revealUps = document.querySelectorAll('.reveal-up');
    revealUps.forEach((el) => {
        gsap.from(el, {
            scrollTrigger: {
                trigger: el,
                start: "top 85%",
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    // Image Reveal with scale
    const revealImages = document.querySelectorAll('.reveal-image');
    revealImages.forEach((img) => {
        gsap.from(img, {
            scrollTrigger: {
                trigger: img,
                start: "top 80%",
            },
            scale: 0.9,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out"
        });
    });

    // ==========================================================================
    // Counter Animation
    // ==========================================================================
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        gsap.to(counter, {
            scrollTrigger: {
                trigger: counter,
                start: "top 90%"
            },
            innerHTML: counter.getAttribute('data-target'),
            duration: 2,
            snap: { innerHTML: 1 },
            ease: "power2.out"
        });
    });

    // ==========================================================================
    // Magnetic Button Effect
    // ==========================================================================
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    
    magneticBtns.forEach((btn) => {
        btn.addEventListener('mousemove', function(e) {
            const position = btn.getBoundingClientRect();
            const x = e.pageX - position.left - position.width / 2;
            const y = e.pageY - position.top - position.height / 2;
            
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.5}px)`;
        });
        
        btn.addEventListener('mouseout', function(e) {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });
});
