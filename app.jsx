const { useState, useEffect } = React;
const L = { provisions: 'Провизия', tools: 'Инструменты', weapons: 'Оружие' };
const API = 'http://localhost:3000/api';

function Card({ item, cat, btn, onBtn }) {
    return (
        <div className="good_card">
            <h3>{item.name}</h3>
            <span className="good_badge">{L[cat]}</span>
            <p>{item.desc}</p>
            <div className="good_price">{item.price}</div>
            {btn && <button className="good_btn" onClick={onBtn}>{btn}</button>}
        </div>
    );
}

function App() {
    var savedUser = localStorage.getItem('torzhishche_user');
    var savedToken = localStorage.getItem('torzhishche_token');
    var savedPage = localStorage.getItem('torzhishche_page');

    const [goods, setGoods] = useState({ provisions: [], tools: [], weapons: [] });
    const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);
    const [token, setToken] = useState(savedToken || '');
    const [page, setPage] = useState(savedPage || 'home');
    const [msg, setMsg] = useState('');

    useEffect(function() {
        localStorage.setItem('torzhishche_page', page);
    }, [page]);

    const load = function() {
        fetch(API + '/goods').then(function(r) { return r.json(); }).then(setGoods);
    };
    useEffect(function() { load(); }, []);

    var headers = token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

    const doRegister = function(e) {
        e.preventDefault();
        var fd = new FormData(e.target);
        var name = fd.get('fullName'), phone = fd.get('phone'), pass = fd.get('password');
        if (!name || !phone || !pass) return setMsg('Заполни все поля.');
        fetch(API + '/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: name, phone: phone, password: pass })
        }).then(function(r) { return r.json(); }).then(function(u) {
            if (u.error) return setMsg(u.error);
            setMsg('Записан. Теперь войди.');
            setPage('login');
        });
    };

    const doLogin = function(e) {
        e.preventDefault();
        var fd = new FormData(e.target);
        var phone = fd.get('phone'), pass = fd.get('password');
        if (!phone || !pass) return setMsg('Заполни все поля.');
        fetch(API + '/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, password: pass })
        }).then(function(r) { return r.json(); }).then(function(data) {
            if (data.error) return setMsg(data.error);
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('torzhishche_token', data.token);
            localStorage.setItem('torzhishche_user', JSON.stringify(data.user));
            setMsg('Вошел. Статус: ' + data.user.status + '.');
            setPage('profile');
        });
    };

    const doLogout = function() {
        setToken('');
        setUser(null);
        localStorage.removeItem('torzhishche_token');
        localStorage.removeItem('torzhishche_user');
        setPage('home');
    };

    const addGood = function(e) {
        e.preventDefault();
        var fd = new FormData(e.target);
        var cat = fd.get('cat'), name = fd.get('name'), desc = fd.get('desc'), price = fd.get('price');
        if (!name || !desc || !price) return setMsg('Заполни все поля.');
        fetch(API + '/goods', {
            method: 'POST', headers: headers,
            body: JSON.stringify({ category: cat, name: name, desc: desc, price: price })
        }).then(function(r) { return r.json(); }).then(function() {
            setMsg('Товар добавлен.');
            load();
            fetch(API + '/user/' + user.phone, { headers: headers })
                .then(function(r) { return r.json(); })
                .then(function(u) {
                    setUser(u);
                    localStorage.setItem('torzhishche_user', JSON.stringify(u));
                });
        });
    };

    const toggle = function(cat, i) {
        fetch(API + '/goods/' + cat + '/' + i, { method: 'PUT', headers: headers }).then(load);
    };

    const remove = function(cat, name) {
        fetch(API + '/goods/' + cat + '/' + encodeURIComponent(name), {
            method: 'DELETE',
            headers: headers
        }).then(load);
    };

    return (
        <div>
            <nav className="nav" style={{marginBottom:15}}>
                <span className="nav_logo" style={{cursor:'pointer'}} onClick={() => setPage('home')}>Торжище</span>
                <div>
                    <a href="#" className="cat_card" onClick={() => setPage('home')} style={{marginRight:5}}>Главная</a>
                    <a href="#" className="cat_card" onClick={() => setPage('goods')} style={{marginRight:5}}>Товары</a>
                    {!user && <a href="#" className="cat_card" onClick={() => setPage('register')} style={{marginRight:5}}>Регистрация</a>}
                    {!user && <a href="#" className="cat_card" onClick={() => setPage('login')} style={{marginRight:5}}>Вход</a>}
                    {user && <a href="#" className="cat_card" onClick={() => setPage('profile')} style={{marginRight:5}}>Профиль</a>}
                    {user && <a href="#" className="cat_card" onClick={doLogout}>Выйти</a>}
                </div>
            </nav>

            {page === 'home' && (
                <div>
                    <section className="banner"><h1>Добро пожаловать на Торжище</h1><p>Здесь крестьянин становится ремесленником, а медяк — золотым</p></section>
                    <section className="categories">
                        <a href="#" className="cat_card" onClick={() => setPage('goods')}>Провизия</a>
                        <a href="#" className="cat_card" onClick={() => setPage('goods')}>Инструменты</a>
                        <a href="#" className="cat_card" onClick={() => setPage('goods')}>Оружие</a>
                    </section>
                    <section className="goods_grid">
                        {Object.keys(goods).map(function(c) {
                            return goods[c].filter(function(i) { return i.available; }).map(function(i, idx) {
                                return <Card key={c+idx} item={i} cat={c} btn="В корзину" />;
                            });
                        })}
                    </section>
                </div>
            )}

            {page === 'goods' && (
                <div>
                    {Object.keys(goods).map(function(c) {
                        return (
                            <section className="goods_section" key={c}><h2>{L[c]}</h2>
                                <div className="goods_grid">
                                    {goods[c].filter(function(i) { return i.available; }).map(function(i, idx) {
                                        return <Card key={c+idx} item={i} cat={c} btn="В корзину" />;
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {page === 'register' && (
                <div className="form_block"><h2>Запись в гильдию</h2>
                    <form onSubmit={doRegister}>
                        <label>ФИО</label><input type="text" name="fullName" placeholder="Иван сын Петров" />
                        <label>Телефон</label><input type="tel" name="phone" placeholder="+7..." />
                        <label>Пароль</label><input type="password" name="password" placeholder="Пароль" />
                        <button type="submit">Записаться</button>
                    </form>
                    <p className="msg" style={{color: msg.includes('Заполни') || msg.includes('Уже') ? '#8b1a1a' : '#2d5a1e'}}>{msg}</p>
                </div>
            )}

            {page === 'login' && (
                <div className="form_block"><h2>Вход в гильдию</h2>
                    <form onSubmit={doLogin}>
                        <label>Телефон</label><input type="tel" name="phone" placeholder="+7..." />
                        <label>Пароль</label><input type="password" name="password" placeholder="Пароль" />
                        <button type="submit">Войти</button>
                    </form>
                    <p className="msg" style={{color: msg.includes('Неверный') || msg.includes('Заполни') ? '#8b1a1a' : '#2d5a1e'}}>{msg}</p>
                </div>
            )}

            {page === 'profile' && (
                <div>
                    <div className="user_profile">
                        <h2>Грамота гильдии</h2>
                        <p><strong>Имя:</strong> {user?.fullName || 'Неизвестно'}</p>
                        <p><strong>Статус:</strong> {user?.status || '-'}</p>
                        <p><strong>Товаров:</strong> {user?.goodsUploaded || 0}</p>
                    </div>
                    <div className="form_block" style={{maxWidth:'100%',margin:'18px auto'}}><h2>Выставить товар</h2>
                        <form onSubmit={addGood}>
                            <input type="text" name="name" placeholder="Название" />
                            <input type="text" name="desc" placeholder="Описание" />
                            <input type="text" name="price" placeholder="Цена" />
                            <select name="cat"><option value="provisions">Провизия</option><option value="tools">Инструменты</option><option value="weapons">Оружие</option></select>
                            <button type="submit">Выставить</button>
                        </form>
                        <p className="msg" style={{color:'#2d5a1e'}}>{msg}</p>
                    </div>
                    <section className="user_goods_section"><h2>Мои товары</h2>
                        <div className="goods_grid">
                            {Object.keys(goods).map(function(c) {
                                return goods[c].filter(function(i) { return i.phone === user.phone; }).map(function(i, idx) {
                                    return (
                                        <div className="good_card" key={c+idx}>
                                            <h3>{i.name}</h3><span className="good_badge">{L[c]}</span><p>{i.desc}</p>
                                            <div className="good_price">{i.price}</div>
                                            <p style={{fontSize:12,color:i.available?'#2d5a1e':'#8b1a1a'}}>{i.available?'В наличии':'Отсутствует'}</p>
                                            <button className="good_btn" onClick={() => toggle(c, idx)}>{i.available?'Снять с торга':'Вернуть на торг'}</button>
                                            <button className="good_btn" onClick={() => remove(c, i.name)} style={{marginTop:4,background:'#6b2a2a',border:'1px solid #ad4a4a'}}>Удалить</button>
                                        </div>
                                    );
                                });
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));