// База данных операторов России (можно расширить)
const operators = {
    'megafon': {
        name: 'МегаФон',
        patterns: ['^9[0-9]{9}$', '^92[0-9]{7}$', '^93[0-9]{7}$'] // Примеры паттернов
    },
    'mts': {
        name: 'МТС',
        patterns: ['^91[0-9]{7}$', '^98[0-9]{7}$']
    },
    'beeline': {
        name: 'Билайн',
        patterns: ['^90[0-9]{7}$', '^96[0-9]{7}$']
    },
    'tele2': {
        name: 'Tele2',
        patterns: ['^95[0-9]{7}$', '^99[0-9]{7}$']
    },
    'other': {
        name: 'Другой оператор',
        patterns: ['.*'] // Любой номер
    }
};

let currentData = []; // Текущие данные в памяти

// Функция для обновления опций операторов (можно расширить для других стран)
function updateOperatorOptions() {
    const country = document.getElementById('countrySelect').value;
    const operatorSelect = document.getElementById('operatorSelect');
    
    // Очищаем и добавляем операторы для выбранной страны
    operatorSelect.innerHTML = '';
    
    if (country === '+7') {
        // Операторы России
        Object.entries(operators).forEach(([value, data]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = data.name;
            operatorSelect.appendChild(option);
        });
    }
    // Здесь можно добавить операторов для других стран
}

// Функция проверки номера
function validateNumber() {
    const country = document.getElementById('countrySelect').value;
    const operatorValue = document.getElementById('operatorSelect').value;
    const numberInput = document.getElementById('numberInput').value.trim();
    const resultDiv = document.getElementById('result');

    // Проверяем, что номер введен
    if (!numberInput) {
        resultDiv.innerHTML = '<span class="invalid">⚠️ Пожалуйста, введите номер</span>';
        return;
    }

    // Получаем данные об операторе
    const operator = operators[operatorValue];
    const fullNumber = country + numberInput;

    // Проверяем номер по паттернам оператора
    let isValid = false;
    for (const pattern of operator.patterns) {
        const regex = new RegExp(pattern);
        if (regex.test(numberInput)) {
            isValid = true;
            break;
        }
    }

    // Создаем запись для истории
    const record = {
        country: country,
        number: numberInput,
        fullNumber: fullNumber,
        operator: operator.name,
        status: isValid ? 'Валиден' : 'Невалиден',
        timestamp: new Date().toLocaleString('ru-RU')
    };

    // Добавляем в текущие данные
    currentData.push(record);

    // Показываем результат
    if (isValid) {
        resultDiv.innerHTML = `<span class="valid">✅ Номер валиден!</span><br>
                              <small>Страна: ${country}<br>
                              Оператор: ${operator.name}<br>
                              Полный номер: ${fullNumber}</small>`;
    } else {
        resultDiv.innerHTML = `<span class="invalid">❌ Номер невалиден для оператора ${operator.name}</span><br>
                              <small>Проверьте правильность ввода</small>`;
    }

    // Обновляем таблицу истории
    updateHistoryTable();
}

// Функция для обновления таблицы истории
function updateHistoryTable() {
    const tableDiv = document.getElementById('historyTable');
    
    if (currentData.length === 0) {
        tableDiv.innerHTML = '';
        return;
    }

    let tableHTML = `
        <table>
            <tr>
                <th>Дата</th>
                <th>Номер</th>
                <th>Оператор</th>
                <th>Статус</th>
            </tr>
    `;

    currentData.slice().reverse().forEach(record => {
        tableHTML += `
            <tr>
                <td>${record.timestamp}</td>
                <td>${record.fullNumber}</td>
                <td>${record.operator}</td>
                <td class="${record.status === 'Валиден' ? 'valid' : 'invalid'}">${record.status}</td>
            </tr>
        `;
    });

    tableHTML += '</table>';
    tableDiv.innerHTML = tableHTML;
}

// Функция для скачивания CSV
function downloadCSV() {
    if (currentData.length === 0) {
        alert('Нет данных для скачивания');
        return;
    }

    const csv = Papa.unparse(currentData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `phone_validator_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Функция для загрузки CSV
function loadCSV(file) {
    if (!file) return;

    Papa.parse(file, {
        header: true,
        complete: function(results) {
            currentData = results.data;
            updateHistoryTable();
            alert(`Загружено ${currentData.length} записей из истории`);
        },
        error: function(error) {
            alert('Ошибка при чтении файла: ' + error);
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateOperatorOptions(); // Инициализируем список операторов
});
