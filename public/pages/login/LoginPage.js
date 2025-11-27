const API_BASE_URL = 'http://localhost:8080';
import { validateEmail, validatePassword } from '../../utils/validation.js';

document.addEventListener('DOMContentLoaded', function() {
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-button');
        const emailHelper = document.getElementById('email-helper');
        const passwordHelper = document.getElementById('password-helper');
        const loginForm = document.getElementById('login-form');

        // 로그인 버튼 활성화
        function updateLoginButtonState() {
            loginButton.disabled = !(validateEmail(emailInput, emailHelper) && validatePassword(passwordInput, passwordHelper));
        }

        // 유효성 검사 및 버튼 상태 업데이트
        emailInput.addEventListener('input', updateLoginButtonState);
        passwordInput.addEventListener('input', updateLoginButtonState);
        
        // blur 이벤트: 포커스가 떠날 때 유효성 헬퍼 텍스트 표시
        emailInput.addEventListener('blur', () => {
            validateEmail(emailInput, emailHelper);
            updateLoginButtonState();
        });
        passwordInput.addEventListener('blur', () => {
            validatePassword(passwordInput, passwordHelper);
            updateLoginButtonState();
        });

        // 로그인 버튼 클릭
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            if (emailInput.value === "") {
                emailHelper.textContent = "이메일을 입력해주세요.";
            }
            if (passwordInput.value === "") {
                passwordHelper.textContent = "비밀번호를 입력해주세요.";
            }

            // 유효성 검사를 통과했을 경우
            if (validateEmail(emailInput, emailHelper) && validatePassword(passwordInput, passwordHelper)) {

                // 서버로 보낼 데이터를 객체로 만듭니다.
                const loginData = {
                    email: emailInput.value,
                    password: passwordInput.value
                };

                try {
                    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json' // JSON 형식으로 전송
                        },
                        body: JSON.stringify(loginData) // 데이터를 JSON 문자열로 변환
                    });

                    const apiResponse = await response.json();

                    if (!response.ok) {
                        const errorMessage = apiResponse?.message || "아이디 또는 비밀번호를 확인해주세요.";
                        passwordHelper.textContent = errorMessage;
                        return;
                    }

                    const accessToken = apiResponse?.data?.accessToken;
                    const userId = apiResponse?.data?.userId;
                    const email = apiResponse?.data?.email;
                    const nickname = apiResponse?.data?.nickname;
                    const profileUrl = apiResponse?.data?.profileUrl;

                    if (accessToken) {
                        localStorage.setItem('accessToken', accessToken);
                    } else {
                        console.warn('응답에 액세스 토큰이 없습니다.', apiResponse);
                    }
                    
                    // 사용자 정보 저장
                    if (userId) {
                        localStorage.setItem('userId', userId.toString());
                    }
                    if (email) {
                        localStorage.setItem('userEmail', email);
                    }
                    if (nickname) {
                        localStorage.setItem('userNickname', nickname);
                    }
                    if (profileUrl) {
                        localStorage.setItem('userProfileUrl', profileUrl);
                    } else {
                        // 프로필 URL이 없으면 빈 문자열로 저장
                        localStorage.setItem('userProfileUrl', '');
                    }

                    window.location.href = 'posts'; // 게시물 목록 페이지로 이동
                } catch (error) {
                    console.error('로그인 중 오류 발생:', error);
                    passwordHelper.textContent = "로그인 중 오류가 발생했습니다.";
                }
            }
        });
});