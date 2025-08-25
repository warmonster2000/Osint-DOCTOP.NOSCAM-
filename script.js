// База данных операторов
const operators = {
    'megafon': { name: 'МегаФон', patterns: ['^9[0-9]{9}$', '^92[0-9]{7}$', '^93[0-9]{7}$'] },
    'mts': { name: 'МТС', patterns: ['^91[0-9]{7}$', '^98[0-9]{7}$'] },
    'beeline': { name: 'Билайн', patterns: ['^90[0-9]{7}$', '^96[0-9]{7}$'] },
    'tele2': { name: 'Tele2', patterns: ['^95[0-9]{7}$', '^99[0-9]{7}$'] },
    'other': { name: 'Другой оператор', patterns: ['.*'] }
};

let processedData = [];

// Функция для обработки загруженного файла
function handleFileUpload(file) {
    if (!file) return;

    document.getElementById('fileInfo').textContent = `Файл: ${file.name} (${formatFileSize(file.size)})`;
    document.getElementById('progress').style.display = 'block';
    document.getElementById('downloadBtn').disabled = true;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Предполагаем, что данные в первом листе
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            processExcelData(jsonData);
        } catch (error) {
            alert('Ошибка при чтении файла: ' + error.message);
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Функция для обработки данных Excel
function processExcelData(data) {
    processedData = [];
    let processedCount = 0;
    const totalRows = data.length;

    data.forEach((row, index) => {
        // Пропускаем пустые строки и заголовки
        if (!row || row.length === 0 || index === 0) return;

        const cellContent = row[0] ? row[0].toString() : ''; // Берем первую ячейку
        
        if (cellContent) {
            const parsedData = parseCellContent(cellContent);
            if (parsedData) {
                processedData.push(parsedData);
            }
        }

        processedCount++;
        updateProgress((processedCount / totalRows) * 100);
    });

    // Задержка для плавного завершения прогресса
    setTimeout(() => {
        document.getElementById('progress').style.display = 'none';
        updateResultsTable();
        document.getElementById('downloadBtn').disabled = false;
    }, 500);
}

// Функция для парсинга содержимого ячейки
function parseCellContent(content) {
    // Убираем лишние пробелы и переносы строк
    const cleanContent = content.replace(/\s+/g, ' ').trim();
    
    // Регулярные выражения для поиска данных
    const phoneRegex = /(\+7|8)[\s\(\-]*(\d{3})[\s\)\-]*(\d{3})[\s\-]*(\d{2})[\s\-]*(\d{2})/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const nameRegex = /[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?/g;
    
    let phone = '';
    let email = '';
    let name = '';
    
    // Ищем телефон
    const phoneMatch = cleanContent.match(phoneRegex);
    if (phoneMatch && phoneMatch[0]) {
        phone = phoneMatch[0].replace(/\D/g, ''); // Оставляем только цифры
        if (phone.startsWith('8')) {
            phone = '7' + phone.slice(1); // Преобразуем 8 в 7
        }
    }
    
    // Ищем email
    const emailMatch = cleanContent.match(emailRegex);
    if (emailMatch && emailMatch[0]) {
        email = emailMatch[0];
    }
    
    // Ищем ФИО
    const nameMatch = cleanContent.match(nameRegex);
    if (nameMatch && nameMatch[0]) {
        name = nameMatch[0];
    }
    
    // Если нашли хотя бы телефон
    if (phone) {
        // Определяем оператора
        const cleanPhone = phone.startsWith('7') ? phone.slice(1) : phone;
        let operator = 'other';
        let operatorName = 'Другой оператор';
        let isValid = false;
        
        for (const [key, opData] of Object.entries(operators)) {
            for (const pattern of opData.patterns) {
                const regex = new RegExp(pattern);
                if (regex.test(cleanPhone)) {
                    operator = key;
                    operatorName = opData.name;
                    isValid = true;
                    break;
                }
            }
            if (isValid) break;
        }
        
        return {
            originalContent: cleanContent,
            phone: phone,
            formattedPhone: formatPhone(phone),
            name: name || 'Не указано',
            email: email || 'Не указан',
            operator: operator,
            operatorName: operatorName,
            status: isValid ? 'Валиден' : 'Невалиден',
            timestamp: new Date().toLocaleString('ru-RU')
        };
    }
    
    return null;
}

// Функция для форматирования телефона
function formatPhone(phone) {
    if (phone.startsWith('7')) {
        return '+7 (' + phone.slice(1, 4) + ') ' + phone.slice(4, 7) + '-' + phone.slice(7, 9) + '-' + phone.slice(9);
    }
    return phone;
}

// Функция для обновления прогресса
function updateProgress(percent) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const roundedPercent = Math.min(100, Math.round(percent));
    progressBar.style.width = roundedPercent + '%';
    progressText.textContent = roundedPercent + '%';
}

// Функция для обновления таблицы результатов
function updateResultsTable() {
    const tbody = document.getElementById('resultsBody');
    const stats = document.getElementById('stats');
    
    stats.textContent = `Обработано: ${processedData.length} записей`;
    tbody.innerHTML = '';
    
    processedData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.formattedPhone}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.operatorName}</td>
            <td class="${item.status === 'Валиден' ? 'valid' : 'invalid'}">${item.status}</td>
        `;
        tbody.appendChild(row);
    });
}

// Функция для фильтрации результатов
function filterResults() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const operatorFilter = document.getElementById('operatorFilter').value;
    
    const filteredData = processedData.filter(item => {
        const matchesSearch = item.formattedPhone.toLowerCase().includes(searchText) ||
                            item.name.toLowerCase().includes(searchText) ||
                            item.email.toLowerCase().includes(searchText);
        
        const matchesOperator = !operatorFilter || item.operator === operatorFilter;
        
        return matchesSearch && matchesOperator;
    });
    
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.formattedPhone}</td>
            <td>${item.name}</td>
            <td>${item.email}</td>
            <td>${item.operatorName}</td>
            <td class="${item.status === 'Валиден' ? 'valid' : 'invalid'}">${item.status}</td>
        `;
        tbody.appendChild(row);
    });
}

// Функция для скачивания CSV
function downloadCSV() {
    if (processedData.length === 0) {
        alert('Нет данных для скачивания');
        return;
    }

    const csvData = processedData.map(item => ({
        'Номер': item.formattedPhone,
        'ФИО': item.name,
        'Email': item.email,
        'Оператор': item.operatorName,
        'Статус': item.status,
        'Дата обработки': item.timestamp
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `parsed_numbers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Функция для очистки результатов
function clearResults() {
    processedData = [];
    document.getElementById('resultsBody').innerHTML = '';
    document.getElementById('stats').textContent = 'Обработано: 0 записей';
    document.getElementById('fileInfo').textContent = 'Файл не выбран';
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('searchInput').value = '';
    document.getElementById('operatorFilter').value = '';
}

// Вспомогательная функция для форматирования размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('Парсер номеров готов к работе!');
});
