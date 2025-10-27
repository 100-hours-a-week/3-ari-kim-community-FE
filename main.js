const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// --- 정적 파일 제공 설정 ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/app.js', express.static(path.join(__dirname, 'app.js')));
app.use('/index.css', express.static(path.join(__dirname, 'index.css')));

// --- 페이지 라우팅 ---
// 루트 (/) 접속 시 -> 게시물 목록 페이지
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/postList/PostListPage.html'));
});

// /login 접속 시 -> 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/login/LoginPage.html'));
});

// (모든 페이지에 대해 app.get() 라우트 추가)
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/signup/SignupPage.html')));
app.get('/post/create', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postCreate/PostCreatePage.html')));
app.get('/post/edit/:id', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postUpdate/PostUpdatePage.html')));
app.get('/post/:id', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/postDetail/PostDetailPage.html')));
app.get('/user/edit', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/userUpdate/UserUpdatePage.html')));
app.get('/user/password', (req, res) => res.sendFile(path.join(__dirname, 'public/pages/passwordUpdate/PasswordUpdatePage.html')));

// --- 서버 실행 ---
app.listen(port, () => {
    console.log(`Express 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});