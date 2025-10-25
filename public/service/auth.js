const API_BASE_URL = '';

document.addEventListener('DOMContentLoaded', function() {

    // =================== 로그인 페이지 =====================
    if (window.location.pathname.includes('LoginPage.html')) {
        
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const loginButton = document.getElementById('login-button');
        const emailHelper = document.getElementById('email-helper');
        const passwordHelper = document.getElementById('password-helper');
        const loginForm = document.getElementById('login-form');

        // 이메일 유효성 검사
        function validateEmail() {
            const email = emailInput.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email === "") {
                emailHelper.textContent = "";
                return false;
            } else if (!emailRegex.test(email)) {
                emailHelper.textContent = "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
                return false;
            } else {
                emailHelper.textContent = "";
                return true;
            }
        }

        // 3. 비밀번호 유효성 검사 (8-20자 제한, 대/소문자, 숫자, 특수문자 포함)
        function validatePassword() {
            const password = passwordInput.value;
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

            if (password === "") {
                passwordHelper.textContent = "";
                return false;
            } else if (!passwordRegex.test(password)) {
                passwordHelper.textContent = "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
                return false;
            } else {
                passwordHelper.textContent = "";
                return true;
            }
        }

        // 로그인 버튼 활성화
        function updateLoginButtonState() {
            loginButton.disabled = !(validateEmail() && validatePassword());
        }

        // 유효성 검사 및 버튼 상태 업데이트
        emailInput.addEventListener('input', updateLoginButtonState);
        passwordInput.addEventListener('input', updateLoginButtonState);

        // 로그인 버튼 클릭
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (emailInput.value === "") {
                emailHelper.textContent = "이메일을 입력해주세요.";
            }
            if (passwordInput.value === "") {
                passwordHelper.textContent = "비밀번호를 입력해주세요.";
            }

            // 유효성 검사를 통과했을 경우
            if (validateEmail() && validatePassword()) {

                // 서버로 보낼 데이터를 객체로 만듭니다.
                const loginData = {
                    email: emailInput.value,
                    password: passwordInput.value
                };

                // 서버에 데이터 전송
                fetch('${API_BASE_URL}/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json' // JSON 형식으로 전송
                    },
                    body: JSON.stringify(loginData) // 데이터를 JSON 문자열로 변환
                })
                .then(response => {
                    // 응답 성공(ok)
                    if (response.ok) { 
                        window.location.href = 'PostListPage.html'; // 게시물 목록 페이지로 이동
                    }
                    // 응답 실패
                    else {
                        passwordHelper.textContent = "아이디 또는 비밀번호를 확인해주세요.";
                    }
                })
                // 예외 상황
                .catch(error => {
                    console.error('로그인 중 오류 발생:', error);
                    passwordHelper.textContent = "로그인 중 오류가 발생했습니다.";
                });
            }
        });
    }


    // =================== 회원가입 페이지 ======================
    if (window.location.pathname.includes('SignupPage.html')) {

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

        // 이메일 유효성 검사
        function validateEmail() {
            const email = emailInput.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email === "") {
                emailHelper.textContent = "이메일을 입력해주세요.";
                return validationStatus.email = false;
            }
            if (!emailRegex.test(email)) {
                emailHelper.textContent = "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
                return validationStatus.email = false;
            }
            // [참고] 중복 검사는 서버에서만 가능합니다.
            emailHelper.textContent = "";
            return validationStatus.email = true;
        }

        // 비밀번호 검사
        function validatePassword() {
            const password = passwordInput.value;
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
            if (password === "") {
                passwordHelper.textContent = "비밀번호를 입력해주세요.";
                return validationStatus.password = false;
            }
            if (!passwordRegex.test(password)) {
                passwordHelper.textContent = "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
                return validationStatus.password = false;
            }
            passwordHelper.textContent = "";
            return validationStatus.password = true;
        }

        // 비밀번호 확인 검사
        function validatePasswordCheck() {
            const password = passwordInput.value;
            const passwordCheck = passwordCheckInput.value;
            if (passwordCheck === "") {
                passwordCheckHelper.textContent = "비밀번호 확인란을 한번 더 입력해주세요.";
                return validationStatus.passwordCheck = false;
            }
            if (password !== passwordCheck) {
                passwordCheckHelper.textContent = "비밀번호가 다릅니다.";
                return validationStatus.passwordCheck = false;
            }
            passwordCheckHelper.textContent = "";
            return validationStatus.passwordCheck = true;
        }

        // 닉네임 검사
        function validateNickname() {
            const nickname = nicknameInput.value;
            if (nickname === "") {
                nicknameHelper.textContent = "닉네임을 입력해주세요.";
                return validationStatus.nickname = false;
            }
            if (/\s/.test(nickname)) {
                nicknameHelper.textContent = "띄어쓰기를 없애주세요.";
                return validationStatus.nickname = false;
            }
            if (nickname.length > 10) {
                nicknameHelper.textContent = "닉네임은 최대 10자까지 작성 가능합니다.";
                return validationStatus.nickname = false;
            }
            nicknameHelper.textContent = "";
            return validationStatus.nickname = true;
        }

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
        emailInput.addEventListener('input', updateSignupButtonState);
        passwordInput.addEventListener('input', updateSignupButtonState);
        passwordCheckInput.addEventListener('input', updateSignupButtonState);
        nicknameInput.addEventListener('input', updateSignupButtonState);

        // 'blur' 이벤트: 포커스가 떠날 때 유효성 헬퍼 텍스트 표시
        emailInput.addEventListener('blur', validateEmail);
        passwordInput.addEventListener('blur', validatePassword);
        passwordCheckInput.addEventListener('blur', validatePasswordCheck);
        passwordInput.addEventListener('blur', validatePasswordCheck);
        nicknameInput.addEventListener('blur', validateNickname);

        // 회원가입
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault(); // 폼 기본 제출(새로고침) 방지

            // 제출 시점에 모든 유효성 검사 다시 실행
            const allClientValid = [
                validateEmail(),
                validatePassword(),
                validatePasswordCheck(),
                validateNickname()
            ].every(status => status === true);

            // 프로필 사진 검사
            if (profilePicFile === null) {
                profilePicHelper.textContent = "프로필 사진을 추가해주세요.";
                return; // 프로필 없으면 중단
            }

        // 클라이언트 검사 통과 시 서버로 전송
            if (allClientValid) {
                // FormData 객체 생성 (파일 + 텍스트)
                const formData = new FormData();
                formData.append('profilePic', profilePicFile);
                formData.append('email', emailInput.value);
                formData.append('password', passwordInput.value);
                formData.append('nickname', nicknameInput.value);

                // fetch로 서버에 전송
                fetch('/api/signup', { // (가상) 회원가입 API 엔드포인트
                    method: 'POST',
                    body: formData // FormData는 'Content-Type'을 자동으로 'multipart/form-data'로 설정
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                    // 회원가입 성공
                        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                        window.location.href = 'LoginPage.html';
                    } else {
                    // 서버측 유효성 검사 실패 (예: 중복 이메일)
                        if (data.field === 'email') {
                            emailHelper.textContent = data.message;
                        } else if (data.field === 'nickname') {
                           nicknameHelper.textContent = data.message;
                        } else {
                            alert(`회원가입 실패: ${data.message}`);
                        }
                    }
                })
                .catch(error => {
                    console.error('회원가입 중 오류 발생:', error);
                    alert('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                });
            }
        });
    }
});