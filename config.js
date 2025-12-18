// Конфигурация системы поддержания активности

module.exports = {
    // Основной URL сайта FanFik
    fanfikUrl: process.env.FANFIK_URL || 'https://fanfik.onrender.com',
    
    // Резервные URL
    backupUrls: [
        'https://fanfik-platform.onrender.com',
        'https://fanfik-app.onrender.com'
    ],
    
    // Интервал проверки (в миллисекундах)
    checkInterval: 4 * 60 * 1000 + 50 * 1000, // 4 минуты 50 секунд
    
    // Таймаут запросов (в миллисекундах)
    requestTimeout: 30000,
    
    // Дополнительные проверки здоровья
    healthChecks: {
        // Проверка API фанфиков
        checkFicsApi: true,
        
        // Проверка главной страницы
        checkHomePage: true,
        
        // Проверка статических файлов
        checkStaticFiles: true
    },
    
    // Настройки логирования
    logging: {
        // Уровень детализации: 'debug', 'info', 'warn', 'error'
        level: 'info',
        
        // Логировать в файл
        logToFile: false,
        
        // Путь к файлу логов
        logFilePath: './keep-alive.log',
        
        // Логировать статистику каждые N минут
        statsInterval: 30
    },
    
    // Уведомления (можно расширить для Telegram/Email)
    notifications: {
        enabled: false,
        
        // Минимальный процент успешных запросов для уведомления
        minSuccessRate: 80,
        
        // Количество последовательных ошибок для уведомления
        consecutiveErrors: 3
    }
};
