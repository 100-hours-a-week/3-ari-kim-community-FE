const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('./app');
const path = require('path');
const fs = require('fs');

test('Express 서버 테스트', async (t) => {
  // 메인 페이지 라우트 테스트
  await t.test('GET / - 메인 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  // 게시글 목록 페이지 테스트
  await t.test('GET /posts - 게시글 목록 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/posts');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  // 로그인 페이지 테스트
  await t.test('GET /login - 로그인 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/login');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  // 회원가입 페이지 테스트
  await t.test('GET /signup - 회원가입 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/signup');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  // 게시글 작성 페이지 테스트
  await t.test('GET /posts/create - 게시글 작성 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/posts/create');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  // 동적 라우트 테스트
  await t.test('GET /posts/:id - 게시글 상세 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/posts/1');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  await t.test('GET /posts/:id/edit - 게시글 수정 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/posts/1/edit');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  await t.test('GET /users/:id/edit - 회원정보 수정 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/users/1/edit');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  await t.test('GET /users/:id/password - 비밀번호 수정 페이지가 정상적으로 응답', async () => {
    const response = await request(app).get('/users/1/password');
    assert.strictEqual(response.status, 200);
    assert.match(response.type, /html/);
  });

  // 정적 파일 제공 테스트
  await t.test('정적 파일 제공 - client.js 파일이 정상적으로 제공', async () => {
    const clientJsPath = path.join(__dirname, 'client.js');
    if (fs.existsSync(clientJsPath)) {
      const response = await request(app).get('/client.js');
      assert.strictEqual(response.status, 200);
      assert.match(response.type, /javascript/);
    }
  });

  await t.test('정적 파일 제공 - index.css 파일이 정상적으로 제공', async () => {
    const cssPath = path.join(__dirname, 'index.css');
    if (fs.existsSync(cssPath)) {
      const response = await request(app).get('/index.css');
      assert.strictEqual(response.status, 200);
      assert.match(response.type, /css/);
    }
  });

  // 존재하지 않는 라우트 테스트
  await t.test('404 처리 - 존재하지 않는 라우트는 404를 반환', async () => {
    const response = await request(app).get('/nonexistent');
    assert.strictEqual(response.status, 404);
  });
});

