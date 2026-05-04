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
    const [goods, setGoods] = useState({ provisions: [], tools: [], weapons: [] });
    const [user, setUser] = useState(null);
    const [page, setPage] = useState('home');
    const [msg, setMsg] = useState('');

    const load = () => fetch(API + '/goods').then(r => r.json()).then(setGoods);
    useEffect(() => { load(); }, []);

    const register = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const name = fd.get('fullName'), phone = fd.get('phone');
        if (!name || !phone) return setMsg('Заполни оба поля.');
        fetch(API + '/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: name, phone })
        }).then(r => r.json()).then(u => {
            localStorage.setItem('torzhishche_user', JSON.stringify(u));
            setUser(u); setMsg('Записан.'); setTimeout(() => setPage('profile'), 1000);
        });
    };

    const addGood = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const cat = fd.get('cat'), name = fd.get('name'), desc = fd.get('desc'), price = fd.get('price');
        if (!name || !desc || !price) return setMsg('Заполни все поля.');
        fetch(API + '/goods', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: cat, name, desc, price })
        }).then(() => { setMsg('Товар добавлен.'); load(); });
    };

    const toggle = (cat, i) => fetch(API + '/goods/' + cat + '/' + i, { method: 'PUT' }).then(load);

    return (
        <div>
            {page === 'home' && (
                <div>
                    <section className="banner"><h1>Добро пожаловать на Торжище</h1><p>Здесь крестьянин становится ремесленником, а медяк — золотым</p></section>
                    <section className="categories">
                        <a href="#" className="cat_card" onClick={() => setPage('goods')}>Провизия</a>
                        <a href="#" className="cat_card" onClick={() => setPage('goods')}>Инструменты</a>
                        <a href="#" className="cat_card" onClick={() => setPage('goods')}>Оружие</a>
                    </section>
                    <section className="goods_grid">
                        {Object.keys(goods).map(c => goods[c].filter(i => i.available).map((i, idx) => <Card key={c+idx} item={i} cat={c} btn="В корзину" />))}
                    </section>
                </div>
            )}

            {page === 'goods' && (
                <div>
                    <a href="#" className="cat_card" onClick={() => setPage('home')} style={{marginBottom:15}}>← Назад</a>
                    {Object.keys(goods).map(c => (
                        <section className="goods_section" key={c}><h2>{L[c]}</h2>
                            <div className="goods_grid">
                                {goods[c].filter(i => i.available).map((i, idx) => <Card key={c+idx} item={i} cat={c} btn="В корзину" />)}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {page === 'register' && (
                <div className="form_block"><h2>Запись в гильдию</h2>
                    <form onSubmit={register}>
                        <label>ФИО</label><input type="text" name="fullName" placeholder="Иван сын Петров" />
                        <label>Номер телефона</label><input type="tel" name="phone" placeholder="+7..." />
                        <button type="submit">Записаться</button>
                    </form>
                    <p className="msg" style={{color: msg.includes('Заполни') ? '#8b1a1a' : '#2d5a1e'}}>{msg}</p>
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
                            {Object.keys(goods).map(c => goods[c].map((i, idx) => (
                                <div className="good_card" key={c+idx}>
                                    <h3>{i.name}</h3><span className="good_badge">{L[c]}</span><p>{i.desc}</p>
                                    <div className="good_price">{i.price}</div>
                                    <p style={{fontSize:12,color:i.available?'#2d5a1e':'#8b1a1a'}}>{i.available?'В наличии':'Отсутствует'}</p>
                                    <button className="good_btn" onClick={() => toggle(c, idx)}>{i.available?'Снять с торга':'Вернуть на торг'}</button>
                                </div>
                            )))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));