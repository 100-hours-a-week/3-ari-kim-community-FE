const API_BASE_URL = 'http://localhost:8080/api';
import { validateEmail, validatePassword, validatePasswordCheck, validateNickname } from '../../utils/validation.js';
import { uploadFileToS3 } from '../../utils/s3Upload.js';

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('/signup') || window.location.pathname.includes('SignupPage.html')) {

        // 1. 필요한 HTML 요소들
        const signupForm = document.getElementById('signup-form');
    
        // 프로필 사진
        const profilePicInput = document.getElementById('profile-pic-input');
        const profilePicPreview = document.getElementById('profile-pic-preview');
        const profilePicHelper = document.getElementById('profile-pic-helper');
        let profilePicFile = null; // 업로드할 파일 객체를 저장할 변수

        // 입력 필드
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const passwordCheckInput = document.getElementById('password-check');
        const nicknameInput = document.getElementById('nickname');

        // 헬퍼 텍스트
        const emailHelper = document.getElementById('email-helper');
        const passwordHelper = document.getElementById('password-helper');
        const passwordCheckHelper = document.getElementById('password-check-helper');
        const nicknameHelper = document.getElementById('nickname-helper');
    
        // 버튼
        const signupButton = document.getElementById('signup-button');

        // 유효성 검사 상태
        const validationStatus = {
            email: false,
            password: false,
            passwordCheck: false,
            nickname: false
            // 프로필 사진은 제출 시점에만 체크
        };

        // 버튼 활성화
        function updateSignupButtonState() {
            // 모든 유효성 검사가 true인지 확인
            const allValid = Object.values(validationStatus).every(status => status === true);
            signupButton.disabled = !allValid;
        }
    
        // 프로필 사진 추가 버튼
        profilePicPreview.addEventListener('click', () => {
            profilePicInput.click();
        });

        // 파일이 선택되었을 때
        profilePicInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                profilePicFile = file; // 파일 저장
                profilePicHelper.textContent = "";

                // 이미지 미리보기
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePicPreview.style.backgroundImage = `url(${e.target.result})`;
                    profilePicPreview.classList.add('has-image'); // + 기호 숨기기용 클래스
                };
                reader.readAsDataURL(file); // 파일을 Data URL로 읽기
            }
        });

        // 이벤트 리스너 연결
        // 'input' 이벤트: 실시간으로 버튼 상태 업데이트
        emailInput.addEventListener('input', () => {
            validationStatus.email = validateEmail(emailInput, emailHelper);
            updateSignupButtonState();
        });
        passwordInput.addEventListener('input', () => {
            validationStatus.password = validatePassword(passwordInput, passwordHelper);
            updateSignupButtonState();
        });
        passwordCheckInput.addEventListener('input', () => {
            validatePasswordCheck(passwordInput, passwordCheckInput, passwordCheckHelper, validationStatus);
            updateSignupButtonState();
        });
        nicknameInput.addEventListener('input', () => {
            validateNickname(nicknameInput, nicknameHelper, validationStatus);
            updateSignupButtonState();
        });

        // 'blur' 이벤트: 포커스가 떠날 때 유효성 헬퍼 텍스트 표시
        emailInput.addEventListener('blur', () => {
            validationStatus.email = validateEmail(emailInput, emailHelper);
            updateSignupButtonState();
        });
        passwordInput.addEventListener('blur', () => {
            validationStatus.password = validatePassword(passwordInput, passwordHelper);
            updateSignupButtonState();
        });
        passwordCheckInput.addEventListener('blur', () => {
            validatePasswordCheck(passwordInput, passwordCheckInput, passwordCheckHelper, validationStatus);
            updateSignupButtonState();
        });
        passwordInput.addEventListener('blur', () => {
            validatePasswordCheck(passwordInput, passwordCheckInput, passwordCheckHelper, validationStatus);
            updateSignupButtonState();
        });
        nicknameInput.addEventListener('blur', () => {
            validateNickname(nicknameInput, nicknameHelper, validationStatus);
            updateSignupButtonState();
        });

        // 회원가입
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // 폼 기본 제출(새로고침) 방지

            // 제출 시점에 모든 유효성 검사 다시 실행
            validationStatus.email = validateEmail(emailInput, emailHelper);
            validationStatus.password = validatePassword(passwordInput, passwordHelper);
            validatePasswordCheck(passwordInput, passwordCheckInput, passwordCheckHelper, validationStatus);
            validateNickname(nicknameInput, nicknameHelper, validationStatus);
            
            const allClientValid = Object.values(validationStatus).every(status => status === true);

            // 프로필 사진 검사
            if (profilePicFile === null) {
                profilePicHelper.textContent = "프로필 사진을 추가해주세요.";
                return; // 프로필 없으면 중단
            }

            // 클라이언트 검사 통과 시 서버로 전송
            if (allClientValid) {
                try {
                    // 1. S3에 파일 업로드
                    signupButton.disabled = true;
                    signupButton.textContent = '업로드 중...';
                    
                    const profileUrl = await uploadFileToS3(profilePicFile, 'users');

                    // 2. Spring Boot API에 회원가입 요청 (S3 URL 포함)
                    const response = await fetch(`${API_BASE_URL}/users/signup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: emailInput.value,
                            password: passwordInput.value,
                            nickname: nicknameInput.value,
                            profileUrl: profileUrl
                        })
                    });

                    const data = await response.json();
                    if (response.ok && data.success) {
                        // 회원가입 성공
                        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                        window.location.href = '/login';
                    } else {
                        // 서버측 유효성 검사 실패 (예: 중복 이메일)
                        const errorMessage = data?.message || '회원가입에 실패했습니다.';
                        if (errorMessage.includes('이메일')) {
                            emailHelper.textContent = errorMessage;
                        } else if (errorMessage.includes('닉네임')) {
                            nicknameHelper.textContent = errorMessage;
                        } else {
                            alert(`회원가입 실패: ${errorMessage}`);
                        }
                    }
                } catch (error) {
                    console.error('회원가입 중 오류 발생:', error);
                    profilePicHelper.textContent = '파일 업로드 중 오류가 발생했습니다.';
                    alert('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                } finally {
                    signupButton.disabled = false;
                    signupButton.textContent = '회원가입';
                }
            }
        });
    }
});