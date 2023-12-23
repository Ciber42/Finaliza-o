const express = require('express');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

const sequelize = new Sequelize('cruduser', 'postgres', '123456', {
  host: 'localhost',
  dialect: 'postgres',
});

const User = sequelize.define('User', {
  login: Sequelize.STRING,
  nome: Sequelize.STRING,
  senha: Sequelize.STRING,
  perfil: Sequelize.STRING,
});

app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'sua_chave_secreta',
  resave: false,
  saveUninitialized: true,
}));
app.set('view engine', 'ejs');

//Autenticação
app.use((req, res, next) => {
   
    if (req.session.usuario || req.path === '/login' || req.path === '/cadastro' || req.path.startsWith('/alteracao') || req.path.startsWith('/exclusao')) {
   
      next();
    } else {
   
      res.redirect('/login');
    }
  });
  
// página de cadastro
app.get('/', (req, res) => {
  res.redirect('/cadastro');
});

app.get('/cadastro', (req, res) => {
    res.render('cadastro');
  });
  
  app.post('/cadastro', async (req, res) => {
    try {
      const { login, nome, senha, perfil } = req.body;
      const hashedPassword = await bcrypt.hash(senha, 10);
  
      await User.create({ login, nome, senha: hashedPassword, perfil });
  
      res.redirect('/login');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro interno do servidor');
    }
  });
  



//formulário de busca
app.get('/busca', (req, res) => {
    res.render('busca');
  });
  
  //  busca e exibir o resultado
  app.post('/resultadoBusca', async (req, res) => {
    const { login } = req.body;
  
    try {
      const user = await User.findOne({ where: { login } });
      res.render('resultadoBusca', { user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro interno do servidor');
    }
  });
  

app.get('/alteracao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    res.render('alteracao', { user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/alteracao/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, senha, perfil } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    await User.update({ nome, senha: hashedPassword, perfil }, { where: { id } });
    res.redirect('/busca');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.get('/exclusao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    res.render('exclusao', { user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

app.post('/exclusao/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await User.destroy({ where: { id } });
    res.redirect('/busca');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});

// login
app.get('/login', (req, res) => {
  res.render('login', { erro: req.session.erro }); 
});

app.post('/login', async (req, res) => {
  const { login, senha } = req.body;

  try {
    const user = await User.findOne({ where: { login } });

    if (user && (await bcrypt.compare(senha, user.senha))) {
      // sessão do usuário 
      req.session.usuario = {
        id: user.id,
        login: user.login,
        nome: user.nome,
        perfil: user.perfil,
      };

      res.redirect('/home');
    } else {
      req.session.erro = 'Credenciais inválidas'; 
      res.redirect('/login');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro interno do servidor');
  }
});


// caso o usuario esta autenticando vai para tela home
app.get('/home', (req, res) => {
  if (req.session.usuario) {
    res.render('home', { usuario: req.session.usuario });
  } else {
    res.redirect('/login');
  }
});

sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao sincronizar com o banco de dados:', error);
  });
