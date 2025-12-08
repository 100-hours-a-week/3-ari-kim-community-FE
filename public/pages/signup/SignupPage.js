import { API_BASE_URL } from '../../utils/config.js';
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
            const isValid = validatePassword(passwordInput, passwordHelper);
            validationStatus.password = isValid;
            // 회원가입 페이지에서는 helper text 항상 표시
            if (!isValid && passwordInput.value !== "") {
                passwordHelper.textContent = "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
            } else if (passwordInput.value === "") {
                passwordHelper.textContent = "";
            } else {
                passwordHelper.textContent = "";
            }
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

            // 클라이언트 검사 통과 시 서버로 전송
            if (allClientValid) {
                try {
                    signupButton.disabled = true;
                    signupButton.textContent = '업로드 중...';
                    
                    // 1. 프로필 사진이 있으면 S3에 업로드
                    let profileUrl = '';
                    let s3UploadError = null;
                    if (profilePicFile) {
                        try {
                            profileUrl = await uploadFileToS3(profilePicFile, 'users');
                        } catch (s3Error) {
                            // S3 업로드 실패는 나중에 처리하고, 먼저 서버 응답을 확인
                            s3UploadError = s3Error;
                            console.error('S3 업로드 실패:', s3Error);
                            console.error('S3 업로드 오류 상세:', {
                                name: s3Error.name,
                                message: s3Error.message,
                                stack: s3Error.stack
                            });
                        }
                    }

                    // S3 업로드가 실패했으면 여기서 처리
                    if (s3UploadError) {
                        // 사용자 친화적인 오류 메시지로 변경
                        profilePicHelper.textContent = '파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.';
                        console.error('S3 업로드 오류로 회원가입 중단:', errorMessage);
                        return;
                    }

                    // 2. Spring Boot API에 회원가입 요청 (S3 URL 포함)
                    let response;
                    try {
                        response = await fetch(`${API_BASE_URL}/users/signup`, {
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
                    } catch (fetchError) {
                        // fetch 자체가 실패한 경우 (네트워크 오류, CORS 오류 등)
                        console.error('Fetch 오류:', fetchError);
                        // fetch는 네트워크 오류가 아닌 경우에도 실패할 수 있으므로
                        // 실제 네트워크 오류인지 확인
                        if (fetchError.message && fetchError.message.includes('Failed to fetch')) {
                            throw new Error('네트워크 오류: 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
                        }
                        throw fetchError;
                    }

                    // 응답을 JSON으로 파싱 (성공/실패 모두)
                    let data = null;
                    try {
                        const responseText = await response.text();
                        if (responseText) {
                            data = JSON.parse(responseText);
                        }
                    } catch (parseError) {
                        // JSON 파싱 실패 시에도 응답 상태를 확인
                        console.error('JSON 파싱 오류:', parseError, 'Response status:', response.status);
                        // 파싱 실패해도 서버가 응답을 보냈으므로 계속 진행
                    }

                    // ApiResponse 구조: { status: 200, message: "요청에 성공했습니다.", data: {...} }
                    // 성공 응답: response.ok && data && data.status === 200
                    // 실패 응답: !response.ok 또는 data.status !== 200
                    if (response.ok && data && (data.status === 200 || response.status === 200)) {
                        // 회원가입 성공
                        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                        window.location.href = '/login';
                    } else {
                        // 서버측 유효성 검사 실패 (예: 중복 이메일, 닉네임)
                        // ErrorResponse의 message 필드 사용
                        const errorMessage = data?.message || '회원가입에 실패했습니다.';
                        
                        console.log('서버 오류 응답:', { 
                            status: response.status, 
                            statusText: response.statusText,
                            message: errorMessage, 
                            data: data 
                        });
                        
                        // 에러 메시지에 따라 적절한 필드에 표시
                        // 서버에서 반환하는 메시지: "이미 사용 중인 이메일입니다.", "이미 사용 중인 닉네임입니다."
                        if (errorMessage.includes('이메일') || errorMessage.includes('이미 사용 중인 이메일')) {
                            emailHelper.textContent = '이미 존재하는 이메일입니다.';
                            // 다른 필드의 에러 메시지 초기화
                            nicknameHelper.textContent = '';
                        } else if (errorMessage.includes('닉네임') || errorMessage.includes('이미 사용 중인 닉네임')) {
                            nicknameHelper.textContent = '이미 존재하는 닉네임입니다.';
                            // 다른 필드의 에러 메시지 초기화
                            emailHelper.textContent = '';
                        } else {
                            // 에러 메시지가 없거나 알 수 없는 경우
                            if (response.status === 409) {
                                // 409 Conflict는 보통 중복 오류
                                emailHelper.textContent = '이미 존재하는 이메일 또는 닉네임입니다.';
                            } else {
                                alert(`회원가입 실패: ${errorMessage}`);
                            }
                        }
                    }
                } catch (error) {
                    console.error('회원가입 중 오류 발생:', error);
                    console.error('오류 상세:', {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    });
                    
                    // 네트워크 오류나 기타 예외 처리
                    if (error.message && error.message.includes('네트워크')) {
                        alert(error.message || '네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
                    } else if (error.message && error.message.includes('서버 응답')) {
                        alert('서버 응답을 읽을 수 없습니다. 잠시 후 다시 시도해주세요.');
                    } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                        alert('서버에 연결할 수 없습니다. 백엔드 서버가 http://localhost:8080 에서 실행 중인지 확인해주세요.');
                    } else {
                        // 실제 네트워크 오류인 경우에만 일반 오류 메시지 표시
                        // 서버 응답이 있는 경우는 이미 위에서 처리됨
                        alert(`회원가입 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
                    }
                } finally {
                    signupButton.disabled = false;
                    signupButton.textContent = '회원가입';
                }
            }
        });
    }
});