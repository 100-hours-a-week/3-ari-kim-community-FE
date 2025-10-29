const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// --- 정적 파일 제공 설정 ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/app.js', express.static(path.join(__dirname, 'app.js')));
app.use('/index.css', express.static(path.join(__dirname, 'index.css')));

// --- 페이지 라우팅 ---
app.get('/posts', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postList/PostListPage.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/login/LoginPage.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/signup/SignupPage.html')));
app.get('/posts/create', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postCreate/PostCreatePage.html')));
app.get('/posts/:id/edit', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postUpdate/PostUpdatePage.html')));
app.get('/posts/:id', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postDetail/PostDetailPage.html')));
app.get('/users/:id/edit', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/userUpdate/UserUpdatePage.html')));
app.get('/users/:id/password', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/passwordUpdate/PasswordUpdatePage.html')));

// --- 서버 실행 ---
app.listen(port, () => {
    console.log(`Express 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});