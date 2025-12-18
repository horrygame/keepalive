#!/usr/bin/env node
require('dotenv').config();

const https = require('https');
const http = require('http');
const axios = require('axios');
const cron = require('node-cron');

class FanFikKeepAlive {
    constructor() {
        this.urls = this.getUrls();
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            lastCheck: null
        };
        this.init();
    }
    
    getUrls() {
        // Получаем URL из переменных окружения или используем дефолтные
        const urls = [];
        
        // Основной сайт FanFik
        if (process.env.FANFIK_URL) {
            urls.push(process.env.FANFIK_URL);
        }
        
        // Резервные URL
        const defaultUrls = [
            'https://fanfik.onrender.com',
            'https://fanfik-platform.onrender.com'
        ];
        
        defaultUrls.forEach(url => {
            if (!urls.includes(url)) {
                urls.push(url);
            }
        });
        
        // Фильтруем только валидные URL
        return urls.filter(url => url && url.startsWith('http'));
    }
    
    init() {
        console.log('🚀 Запуск системы поддержания активности FanFik...');
        console.log(`📡 Отслеживаемые URL: ${this.urls.join(', ')}`);
        console.log('⏰ Расписание: каждые 4 минуты 50 секунд');
        
        // Немедленная проверка при запуске
        this.pingAll();
        
        // Настраиваем cron задачу каждые 5 минут
        cron.schedule('*/5 * * * *', () => {
            this.pingAll();
        });
        
        // Альтернативный вариант с setInterval (каждые 4:50)
        setInterval(() => {
            this.pingAll();
        }, 4 * 60 * 1000 + 50 * 1000);
        
        // Логирование статистики каждые 30 минут
        setInterval(() => {
            this.logStats();
        }, 30 * 60 * 1000);
        
        // Обработка сигналов завершения
        this.setupSignalHandlers();
    }
    
    async pingAll() {
        const timestamp = new Date().toLocaleString('ru-RU');
        console.log(`\n🔄 [${timestamp}] Проверка активности сайтов...`);
        
        for (const url of this.urls) {
            await this.ping(url);
            // Небольшая пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.stats.lastCheck = new Date();
        console.log(`📊 Завершено. Успешно: ${this.stats.successfulRequests}/${this.stats.totalRequests}`);
    }
    
    async ping(url) {
        if (!url) return;
        
        this.stats.totalRequests++;
        
        try {
            // Используем axios для более удобной работы с HTTP
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'FanFik-Keep-Alive/1.0',
                    'Accept': 'application/json, text/html'
                }
            });
            
            this.stats.successfulRequests++;
            console.log(`✅ ${url}: ${response.status} - ${response.statusText}`);
            
            // Дополнительная проверка для FanFik API
            if (url.includes('fanfik')) {
                await this.checkFanFikHealth(url);
            }
            
        } catch (error) {
            this.stats.failedRequests++;
            
            if (error.code === 'ECONNREFUSED') {
                console.error(`❌ ${url}: Не удалось подключиться`);
            } else if (error.code === 'ETIMEDOUT') {
                console.error(`⏰ ${url}: Таймаут (30 секунд)`);
            } else if (error.response) {
                console.error(`⚠️ ${url}: ${error.response.status} - ${error.response.statusText}`);
            } else {
                console.error(`❌ ${url}: ${error.message}`);
            }
            
            // Пробуем альтернативный протокол
            await this.tryAlternativeProtocol(url);
        }
    }
    
    async checkFanFikHealth(baseUrl) {
        try {
            const healthUrl = `${baseUrl}/api/fics`;
            const response = await axios.get(healthUrl, {
                timeout: 15000
            });
            
            if (response.data && Array.isArray(response.data)) {
                console.log(`   📚 Фанфиков доступно: ${response.data.length}`);
            }
        } catch (error) {
            // Игнорируем ошибки проверки здоровья
        }
    }
    
    async tryAlternativeProtocol(url) {
        const altUrl = url.replace('https://', 'http://').replace('http://', 'https://');
        
        console.log(`   🔄 Пробую альтернативный протокол: ${altUrl}`);
        
        try {
            const response = await axios.get(altUrl, {
                timeout: 15000
            });
            
            console.log(`   ✅ Альтернативный протокол работает: ${response.status}`);
            
            // Сохраняем рабочий URL для будущих запросов
            if (!this.urls.includes(altUrl)) {
                this.urls.push(altUrl);
                console.log(`   📝 Добавлен в список отслеживания: ${altUrl}`);
            }
            
        } catch (altError) {
            console.log(`   ❌ Альтернативный протокол также не работает`);
        }
    }
    
    logStats() {
        const now = new Date();
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        console.log('\n📈 ========== СТАТИСТИКА ==========');
        console.log(`🕐 Время работы: ${hours}ч ${minutes}м`);
        console.log(`📊 Всего запросов: ${this.stats.totalRequests}`);
        console.log(`✅ Успешных: ${this.stats.successfulRequests}`);
        console.log(`❌ Ошибок: ${this.stats.failedRequests}`);
        console.log(`📈 Успешность: ${this.calculateSuccessRate()}%`);
        console.log(`⏰ Последняя проверка: ${this.stats.lastCheck ? this.stats.lastCheck.toLocaleString('ru-RU') : 'никогда'}`);
        console.log('===================================\n');
    }
    
    calculateSuccessRate() {
        if (this.stats.totalRequests === 0) return 0;
        return ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(2);
    }
    
    setupSignalHandlers() {
        process.on('SIGINT', () => {
            console.log('\n🛑 Получен SIGINT, завершение работы...');
            this.logStats();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n🛑 Получен SIGTERM, завершение работы...');
            this.logStats();
            process.exit(0);
        });
        
        process.on('uncaughtException', (error) => {
            console.error('\n💥 Необработанная ошибка:', error);
            this.logStats();
            process.exit(1);
        });
    }
}

// Запуск приложения
if (require.main === module) {
    const keepAlive = new FanFikKeepAlive();
    
    // Экспортируем для тестирования
    module.exports = keepAlive;
} else {
    module.exports = FanFikKeepAlive;
}
