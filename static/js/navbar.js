// static/js/navbar.js

// Script para el comportamiento del navbar
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    
    // Scroll behavior para navbar compacto
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled', 'compact-nav', 'small-header');
        } else {
            navbar.classList.remove('scrolled', 'compact-nav', 'small-header');
        }
    });

    // Añadir clase enhanced-title a todos los títulos de página
    const pageTitles = document.querySelectorAll('.page-title, .display-4, .display-5');
    pageTitles.forEach(title => {
        title.classList.add('enhanced-title');
    });

    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Cerrar navbar móvil al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav-link');
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });

    console.log('Navbar behavior loaded successfully');
});