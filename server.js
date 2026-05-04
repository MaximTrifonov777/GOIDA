var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();

app.use(express.json());
app.use(express.static(__dirname));

var goodsFile = path.join(__dirname, 'goods.json');
var usersFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(goodsFile)) {
    var defaultGoods = {
        provisions: [
            { name: 'Копчёный окорок', desc: 'Свиной окорок на ольховой щепе.', price: '7 серебряных', available: true },
            { name: 'Ржаной хлеб', desc: 'Буханка из печи, хрустящая корочка.', price: '3 медяка', available: true },
            { name: 'Сыр выдержанный', desc: 'Голова сыра из монастырских погребов.', price: '4 серебряных', available: true }
        ],
        tools: [
            { name: 'Топор плотника', desc: 'Лезвие доброй стали, топорище ясеневое.', price: '10 золотых', available: true },
            { name: 'Гусли звонкие', desc: 'Девять струн, корпус из клёна.', price: '14 золотых', available: true },
            { name: 'Наковальня малая', desc: 'Походная, для правки клинков.', price: '22 золотых', available: true }
        ],
        weapons: [
            { name: 'Кинжал узкий', desc: 'Прячется в рукаве, бьёт без промаха.', price: '18 золотых', available: true },
            { name: 'Меч короткий', desc: 'Закалённая сталь, не подведёт.', price: '25 золотых', available: true },
            { name: 'Лук тисовый', desc: 'Бьёт на сто шагов, тетива пеньковая.', price: '15 золотых', available: true }
        ]
    };
    fs.writeFileSync(goodsFile, JSON.stringify(defaultGoods, null, 2));
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

app.get('/api/goods', function(req, res) {
    var goods = JSON.parse(fs.readFileSync(goodsFile));
    res.json(goods);
});

app.post('/api/goods', function(req, res) {
    var goods = JSON.parse(fs.readFileSync(goodsFile));
    var cat = req.body.category;
    var name = req.body.name;
    var desc = req.body.desc;
    var price = req.body.price;

    if (!goods[cat]) {
        return res.status(400).json({ error: 'Неверная категория' });
    }

    goods[cat].push({ name: name, desc: desc, price: price, available: true });
    fs.writeFileSync(goodsFile, JSON.stringify(goods, null, 2));
    res.json({ message: 'Товар добавлен' });
});

app.put('/api/goods/:category/:index', function(req, res) {
    var goods = JSON.parse(fs.readFileSync(goodsFile));
    var cat = req.params.category;
    var index = parseInt(req.params.index);

    if (!goods[cat] || !goods[cat][index]) {
        return res.status(404).json({ error: 'Товар не найден' });
    }

    goods[cat][index].available = !goods[cat][index].available;
    fs.writeFileSync(goodsFile, JSON.stringify(goods, null, 2));
    res.json({ message: 'Статус изменён' });
});

app.post('/api/register', function(req, res) {
    var users = JSON.parse(fs.readFileSync(usersFile));
    var fullName = req.body.fullName;
    var phone = req.body.phone;

    if (!fullName || !phone) {
        return res.status(400).json({ error: 'Заполни все поля' });
    }

    var user = {
        fullName: fullName,
        phone: phone,
        status: 'Крестьянин',
        goodsUploaded: 0
    };

    users.push(user);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    res.json(user);
});

app.get('/api/user/:phone', function(req, res) {
    var users = JSON.parse(fs.readFileSync(usersFile));
    var user = users.find(function(u) {
        return u.phone === req.params.phone;
    });

    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.json(user);
});

app.listen(3000, function() {
    console.log('Торжище открыто на порту 3000');
});