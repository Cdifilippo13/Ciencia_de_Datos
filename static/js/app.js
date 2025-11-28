// main.js - JavaScript para la aplicación de Segmentación de Mercado

class SegmentationApp {
    constructor() {
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.loadInitialStats();
        this.initializeCharts();
    }

    initializeEventListeners() {
        // Navigation active state
        this.handleNavigation();
        
        // Form submissions
        this.handleFormSubmissions();
        
        // Interactive elements
        this.handleInteractiveElements();
    }

    handleNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    handleFormSubmissions() {
        const predictionForm = document.getElementById('predictionForm');
        if (predictionForm) {
            predictionForm.addEventListener('submit', (e) => {
                this.handlePredictionSubmit(e);
            });
        }
    }

    async handlePredictionSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<div class="loading me-2"></div> Procesando...';
        submitButton.disabled = true;
        
        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Convert numeric values
            Object.keys(data).forEach(key => {
                data[key] = parseFloat(data[key]);
            });
            
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showPredictionResult(result);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            this.showError('Error en la predicción: ' + error.message);
        } finally {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }

    showPredictionResult(result) {
        const resultHTML = `
            <div class="prediction-result p-4 mb-4 text-center">
                <i class="fas fa-check-circle fa-4x mb-3 text-success"></i>
                <h2 class="fw-bold">¡Predicción Completada!</h2>
                <h4 class="mb-3">El cliente pertenece al segmento:</h4>
                <div class="display-4 fw-bold text-warning">${result.cluster_name}</div>
            </div>
            
            <div class="segment-info p-4 mb-4">
                <h5 class="fw-bold mb-3">
                    <i class="fas fa-info-circle me-2"></i>
                    Información del Segmento
                </h5>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Tamaño del Segmento:</strong><br>
                        ${result.segment_info.size} clientes (${result.segment_info.percentage.toFixed(1)}%)</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Edad Promedio:</strong><br>
                        ${result.segment_info.avg_age.toFixed(1)} años</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Ingreso Promedio:</strong><br>
                        $${result.segment_info.avg_income.toFixed(1)}k</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Gasto Promedio:</strong><br>
                        ${result.segment_info.avg_spending.toFixed(1)} puntos</p>
                    </div>
                </div>
            </div>
            
            <div class="alert alert-info">
                <h6><i class="fas fa-lightbulb me-2"></i>Recomendaciones de Marketing:</h6>
                <p class="mb-0">${this.getMarketingRecommendations(result.cluster_name)}</p>
            </div>
            
            <div class="text-center mt-4">
                <button onclick="location.reload()" class="btn btn-primary btn-lg">
                    <i class="fas fa-plus me-2"></i>Nueva Predicción
                </button>
            </div>
        `;
        
        document.querySelector('.card-body').innerHTML = resultHTML;
    }

    getMarketingRecommendations(clusterName) {
        const recommendations = {
            'Premium': 'Ofrecer productos de alta gama, atención personalizada y programas de fidelización exclusivos.',
            'Económicos': 'Enfocarse en precios competitivos, promociones y valor por dinero.',
            'Jóvenes': 'Utilizar marketing digital, redes sociales y productos innovadores.',
            'Senior': 'Enfocarse en confiabilidad, servicio al cliente y facilidad de uso.'
        };
        
        for (const [key, value] of Object.entries(recommendations)) {
            if (clusterName.includes(key)) {
                return value;
            }
        }
        
        return 'Desarrollar estrategias personalizadas basadas en el análisis detallado del segmento.';
    }

    showError(message) {
        const errorHTML = `
            <div class="alert alert-danger">
                <h5><i class="fas fa-exclamation-triangle me-2"></i>Error</h5>
                <p class="mb-0">${message}</p>
            </div>
            <div class="text-center mt-3">
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-arrow-left me-2"></i>Intentar Nuevamente
                </button>
            </div>
        `;
        
        document.querySelector('.card-body').innerHTML = errorHTML;
    }

    loadInitialStats() {
        // Animar contadores en la página de inicio
        this.animateCounters();
    }

    animateCounters() {
        const counters = document.querySelectorAll('#totalClients, #totalSegments, #accuracy, #predictions');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target') || counter.textContent);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current);
                }
            }, 16);
        });
    }

    initializeCharts() {
        // Inicializar gráficos adicionales si es necesario
        this.initializeCustomCharts();
    }

    initializeCustomCharts() {
        // Aquí puedes agregar gráficos personalizados con Chart.js si lo necesitas
        console.log('Charts initialized');
    }

    handleInteractiveElements() {
        // Tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
}

// Utility functions
class AppUtils {
    static formatNumber(number) {
        return new Intl.NumberFormat('es-ES').format(number);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static async fetchData(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
    }
}

// Example data for quick fill (compatible con predict.html)
const examples = {
    'premium': {
        'Age': 45,
        'Annual_Income_(k$)': 85,
        'Spending_Score': 75,
        'Years_with_Company': 5,
        'Total_Purchases': 25,
        'Avg_Transaction_Value': 120
    },
    'economico': {
        'Age': 38,
        'Annual_Income_(k$)': 35,
        'Spending_Score': 25,
        'Years_with_Company': 2,
        'Total_Purchases': 8,
        'Avg_Transaction_Value': 45
    },
    'joven': {
        'Age': 25,
        'Annual_Income_(k$)': 45,
        'Spending_Score': 65,
        'Years_with_Company': 1,
        'Total_Purchases': 12,
        'Avg_Transaction_Value': 75
    }
};

// Global functions for HTML onclick events
function fillExample(type) {
    const example = examples[type];
    for (const [key, value] of Object.entries(example)) {
        const input = document.getElementById(key);
        if (input) {
            input.value = value;
        }
    }
}

function refreshDashboard() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<div class="loading me-2"></div> Actualizando...';
    btn.disabled = true;
    
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.segmentationApp = new SegmentationApp();
});

// Export for module usage (si se usa como módulo)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SegmentationApp, AppUtils };
}