(function() {
    let style = '#our_logo{display:block;z-index:9999;position:absolute;user-select:none}#our_logo.size_140{width:140px;height:18px}#our_logo.size_120{width:120px;height:18px}';

    // Функция для получения домена реферера
    function getReferrerHostname() {
        try {
            if (!document.referrer) return "";
            const url = new URL(document.referrer);
            return url.hostname.toLowerCase();
        } catch (e) {
            return "";
        }
    }

    // Функция для получения источника трафика (для iframe)
    function getTrafficSource() {
        try {
            // Пытаемся получить домен родительского окна (для iframe)
            if (window.parent && window.parent !== window) {
                return window.parent.location.hostname.toLowerCase();
            }
        } catch (e) {
            // Если доступ заблокирован CORS, используем referrer
            return getReferrerHostname();
        }
        return getReferrerHostname();
    }

    // Функция для создания UTM-параметров
    function generateUTMParams() {
        const trafficSource = getTrafficSource();
        const isOwnDomain = ["igru.net", "igru.com.ua", "8games.net", "1gry.pl"].includes(trafficSource);
        const isInIframe = window.self !== window.top;
        const params = new URLSearchParams();
        
        params.set('utm_source', 'logo_link');
        
        if (isInIframe && isOwnDomain) {
            params.set('utm_medium', 'iframe_own');
        } else if (isInIframe) {
            params.set('utm_medium', 'iframe_external');
        } else {
            params.set('utm_medium', 'direct');
        }
        
        if (trafficSource) {
            params.set('utm_campaign', trafficSource);
        }
        
        return params.toString();
    }

    let vse = {
        "size_140": '<div id="our_logo" class="size_140"><a target="_blank" href="https://igru.net/{{UTM}}" title="Все Игры - Онлайн | Тот Самый Оригинал"><img src="/dasha1/111_4.png" width="140" height="18" style="cursor: pointer;" title="Все Игры - Онлайн | Тот Самый Оригинал" alt="Все Игры - Онлайн | Тот Самый Оригинал"></a></div>',
        "size_120": '<div id="our_logo" class="size_120"><a target="_blank" href="https://igru.net/{{UTM}}" title="Все Игры - Онлайн | Тот Самый Оригинал"><img src="/dasha1/111_4.png" width="120" height="18" style="cursor: pointer;" title="Все Игры - Онлайн | Тот Самый Оригинал" alt="Все Игры - Онлайн | Тот Самый Оригинал"></a></div>'
    };
    let gm = {
        "size_140": '<div id="our_logo" class="size_140"><a target="_blank" href="https://8games.net/{{UTM}}" title="All Games Online - Play For Free"><img src="/dasha1/1112.png" width="140" height="18" style="cursor: pointer;" title="All Games Online - Play For Free" alt="All Games Online - Play For Free"></a></div>',
        "size_120": '<div id="our_logo" class="size_120"><a target="_blank" href="https://8games.net/{{UTM}}" title="All Games Online - Play For Free"><img src="/dasha1/1112.png" width="120" height="18" style="cursor: pointer;" title="All Games Online - Play For Free" alt="All Games Online - Play For Free"></a></div>'
    };

    let css = (e, styles) => {
        for (const property in styles)
            e.style[property] = styles[property];
    };

    let alertLogo = (size = '140', position) => {
        const sheet = document.createElement('style');
        sheet.innerHTML = style;
        document.body.appendChild(sheet);
        const wrapperLogo = document.createElement('div');
        
        let lang  = (navigator.language || navigator.userLanguage).slice(0, 2);
        let currentLogo = '';
        
        document.referrer.includes(atob("OGdhbWVzLm5ldA==")) && (lang = 'gm');
        document.referrer.includes(atob("aWdydS5uZXQ=")) && (lang = 'vse');
        
        ((lang === 'en' || lang === 'gm') && lang !== 'vse') ? currentLogo = gm['size_' + size] : currentLogo = vse['size_' + size];
        
        // Генерируем UTM-параметры и добавляем их в ссылку
        const utmParams = generateUTMParams();
        currentLogo = currentLogo.replace('{{UTM}}', '?' + utmParams);
        
        wrapperLogo.innerHTML = currentLogo;
        document.body.appendChild(wrapperLogo);
        
        typeof position != 'undefined' && (css(document.getElementById('our_logo'), position));
    };

    window.alertLogo = alertLogo;
})();