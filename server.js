var express = require('express');
var fs = require('fs');
var path = require('path');
var jwt = require('jsonwebtoken');
var app = express();
var SECRET = 'torzhishche-secret-key';

app.use(express.json());
app.use(express.static(__dirname));

var goodsFile = path.join(__dirname, 'goods.json');
var usersFile = path.join(__dirname, 'users.json');

if (!fs.existsSync(goodsFile)) {
    fs.writeFileSync(goodsFile, JSON.stringify({
        provisions: [
            { name: 'Копчёный окорок', desc: 'Свиной окорок на ольховой щепе.', price: '7 серебряных', available: true, phone: '' },
            { name: 'Ржаной хлеб', desc: 'Буханка из печи.', price: '3 медяка', available: true, phone: '' }
        ],
        tools: [
            { name: 'Топор плотника', desc: 'Лезвие доброй стали.', price: '10 золотых', available: true, phone: '' },
            { name: 'Гусли звонкие', desc: 'Девять струн, корпус из клёна.', price: '14 золотых', available: true, phone: '' }
        ],
        weapons: [
            { name: 'Кинжал узкий', desc: 'Прячется в рукаве.', price: '18 золотых', available: true, phone: '' },
            { name: 'Меч короткий', desc: 'Закалённая сталь.', price: '25 золотых', available: true, phone: '' }
        ]
    }, null, 2));
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

function auth(req, res, next) {
    var token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'Нет токена' });
    try {
        req.user = jwt.verify(token.replace('Bearer ', ''), SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'Неверный токен' });
    }
}

app.get('/api/goods', function(req, res) {
    res.json(JSON.parse(fs.readFileSync(goodsFile)));
});

app.post('/api/goods', auth, function(req, res) {
    var goods = JSON.parse(fs.readFileSync(goodsFile));
    var cat = req.body.category;
    goods[cat].push({
        name: req.body.name,
        desc: req.body.desc,
        price: req.body.price,
        available: true,
        phone: req.user.phone
    });
    fs.writeFileSync(goodsFile, JSON.stringify(goods, null, 2));

    var users = JSON.parse(fs.readFileSync(usersFile));
    var user = users.find(function(u) { return u.phone === req.user.phone; });
    if (user) {
        if (user.status === 'Крестьянин') user.status = 'Ремесленник';
        user.goodsUploaded = (user.goodsUploaded || 0) + 1;
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    }
    res.json({ message: 'Товар добавлен' });
});

app.put('/api/goods/:category/:index', auth, function(req, res) {
    var goods = JSON.parse(fs.readFileSync(goodsFile));
    var cat = req.params.category;
    var index = parseInt(req.params.index);
    goods[cat][index].available = !goods[cat][index].available;
    fs.writeFileSync(goodsFile, JSON.stringify(goods, null, 2));
    res.json({ message: 'Статус изменён' });
});

app.delete('/api/goods/:category/:name', auth, function(req, res) {
    var goods = JSON.parse(fs.readFileSync(goodsFile));
    var cat = req.params.category;
    var name = decodeURIComponent(req.params.name);
    var phone = req.user.phone;

    var index = goods[cat].findIndex(function(item) {
        return item.name === name && item.phone === phone;
    });

    if (index === -1) {
        return res.status(404).json({ error: 'Товар не найден или не твой' });
    }

    goods[cat].splice(index, 1);
    fs.writeFileSync(goodsFile, JSON.stringify(goods, null, 2));
    res.json({ message: 'Товар удалён' });
});

app.post('/api/register', function(req, res) {
    var users = JSON.parse(fs.readFileSync(usersFile));
    if (users.find(function(u) { return u.phone === req.body.phone; })) {
        return res.status(400).json({ error: 'Уже зарегистрирован' });
    }
    var user = { fullName: req.body.fullName, phone: req.body.phone, password: req.body.password, status: 'Крестьянин', goodsUploaded: 0 };
    users.push(user);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    res.json({ fullName: user.fullName, phone: user.phone, status: user.status, goodsUploaded: user.goodsUploaded });
});

app.post('/api/login', function(req, res) {
    var users = JSON.parse(fs.readFileSync(usersFile));
    var user = users.find(function(u) { return u.phone === req.body.phone && u.password === req.body.password; });
    if (!user) return res.status(401).json({ error: 'Неверный телефон или пароль' });
    var token = jwt.sign({ phone: user.phone, fullName: user.fullName }, SECRET, { expiresIn: '24h' });
    res.json({ token: token, user: { fullName: user.fullName, phone: user.phone, status: user.status, goodsUploaded: user.goodsUploaded } });
});

app.get('/api/user/:phone', auth, function(req, res) {
    var users = JSON.parse(fs.readFileSync(usersFile));
    var user = users.find(function(u) { return u.phone === req.params.phone; });
    if (!user) return res.status(404).json({ error: 'Не найден' });
    res.json({ fullName: user.fullName, phone: user.phone, status: user.status, goodsUploaded: user.goodsUploaded });
});

app.listen(3000, function() {
    console.log('Торжище открыто на порту 3000');
});