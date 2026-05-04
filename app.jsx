const { useState, useEffect } = React;

const catLabels = {
    provisions: 'Провизия',
    tools: 'Инструменты',
    weapons: 'Оружие'
};

function App() {
    const [goods, setGoods] = useState({ provisions: [], tools: [], weapons: [] });
    const [user, setUser] = useState(null);
    const [page, setPage] = useState('home');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetch('http://localhost:3000/api/goods')
            .then(res => res.json())
            .then(data => setGoods(data));
    }, []);

    const refreshGoods = () => {
        fetch('http://localhost:3000/api/goods')
            .then(res => res.json())
            .then(data => setGoods(data));
    };

    const register = (fullName, phone) => {
        if (!fullName || !phone) {
            setMsg('Заполни оба поля.');
            return;
        }
        fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, phone })
        })
            .then(res => res.json())
            .then(data => {
                localStorage.setItem('torzhishche_user', JSON.stringify(data));
                setUser(data);
                setMsg('Записан. Статус: Крестьянин.');
                setTimeout(() => setPage('profile'), 1500);
            });
    };

    const addGood = (cat, name, desc, price) => {
        if (!name || !desc || !price) {
            setMsg('Заполни все поля.');
            return;
        }
        fetch('http://localhost:3000/api/goods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: cat, name, desc, price })
        })
            .then(res => res.json())
            .then(() => {
                setMsg('Товар добавлен.');
                refreshGoods();
            });
    };

    const toggleAvailability = (cat, index) => {
        fetch(`http://localhost:3000/api/goods/${cat}/${index}`, {
            method: 'PUT'
        })
            .then(() => refreshGoods());
    };

    if (page === 'home') {
        return (
            <div>
                <section className="banner">
                    <h1>Добро пожаловать на Торжище</h1>
                    <p>Здесь крестьянин становится ремесленником, а медяк — золотым</p>
                </section>

                <section className="categories">
                    <a href="#" className="cat_card" onClick={() => setPage('goods')}>Провизия</a>
                    <a href="#" className="cat_card" onClick={() => setPage('goods')}>Инструменты</a>
                    <a href="#" className="cat_card" onClick={() => setPage('goods')}>Оружие</a>
                </section>

                <section className="goods_grid">
                    {Object.keys(goods).map(cat =>
                        goods[cat]
                            .filter(item => item.available)
                            .map((item, index) => (
                                <div className="good_card" key={`${cat}-${index}`}>
                                    <h3>{item.name}</h3>
                                    <span className="good_badge">{catLabels[cat]}</span>
                                    <p>{item.desc}</p>
                                    <div className="good_price">{item.price}</div>
                                    <button className="good_btn">В корзину</button>
                                </div>
                            ))
                    )}
                </section>
            </div>
        );
    }

    if (page === 'goods') {
        return (
            <div>
                <button onClick={() => setPage('home')} className="cat_card" style={{ marginBottom: '15px' }}>← Назад</button>
                {Object.keys(goods).map(cat => (
                    <section className="goods_section" key={cat}>
                        <h2>{catLabels[cat]}</h2>
                        <div className="goods_grid">
                            {goods[cat]
                                .filter(item => item.available)
                                .map((item, index) => (
                                    <div className="good_card" key={`${cat}-${index}`}>
                                        <h3>{item.name}</h3>
                                        <span className="good_badge">{catLabels[cat]}</span>
                                        <p>{item.desc}</p>
                                        <div className="good_price">{item.price}</div>
                                        <button className="good_btn">В корзину</button>
                                    </div>
                                ))}
                        </div>
                    </section>
                ))}
            </div>
        );
    }

    if (page === 'register') {
        const handleSubmit = (e) => {
            e.preventDefault();
            const name = e.target.fullName.value;
            const phone = e.target.phone.value;
            register(name, phone);
        };

        return (
            <div className="form_block">
                <h2>Запись в гильдию</h2>
                <form onSubmit={handleSubmit}>
                    <label>ФИО</label>
                    <input type="text" name="fullName" placeholder="Иван сын Петров" required />
                    <label>Номер телефона</label>
                    <input type="tel" name="phone" placeholder="+7..." required />
                    <button type="submit">Записаться</button>
                </form>
                <p className="msg" style={{ color: msg.includes('Заполни') ? '#8b1a1a' : '#2d5a1e' }}>{msg}</p>
            </div>
        );
    }

    if (page === 'profile') {
        const handleAdd = (e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const desc = e.target.desc.value;
            const price = e.target.price.value;
            const cat = e.target.cat.value;
            addGood(cat, name, desc, price);
        };

        return (
            <div>
                <div className="user_profile">
                    <h2>Грамота гильдии</h2>
                    <p><strong>Имя:</strong> {user?.fullName}</p>
                    <p><strong>Статус:</strong> {user?.status}</p>
                    <p><strong>Товаров загружено:</strong> {user?.goodsUploaded}</p>
                </div>

                <div className="form_block" style={{ maxWidth: '100%', margin: '18px auto' }}>
                    <h2>Выставить товар на торг</h2>
                    <form onSubmit={handleAdd}>
                        <input type="text" name="name" placeholder="Название товара" />
                        <input type="text" name="desc" placeholder="Описание" />
                        <input type="text" name="price" placeholder="Цена" />
                        <select name="cat">
                            <option value="provisions">Провизия</option>
                            <option value="tools">Инструменты</option>
                            <option value="weapons">Оружие</option>
                        </select>
                        <button type="submit">Выставить</button>
                    </form>
                    <p className="msg" style={{ color: '#2d5a1e' }}>{msg}</p>
                </div>

                <section className="user_goods_section">
                    <h2>Мои товары</h2>
                    <div className="goods_grid">
                        {Object.keys(goods).map(cat =>
                            goods[cat].map((item, index) => (
                                <div className="good_card" key={`${cat}-${index}`}>
                                    <h3>{item.name}</h3>
                                    <span className="good_badge">{catLabels[cat]}</span>
                                    <p>{item.desc}</p>
                                    <div className="good_price">{item.price}</div>
                                    <p style={{ fontSize: '12px', color: item.available ? '#2d5a1e' : '#8b1a1a' }}>
                                        {item.available ? 'В наличии' : 'Отсутствует'}
                                    </p>
                                    <button className="good_btn" onClick={() => toggleAvailability(cat, index)}>
                                        {item.available ? 'Снять с торга' : 'Вернуть на торг'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        );
    }

    return null;
}

ReactDOM.render(<App />, document.getElementById('root'));