// 1. (경로 확인) utils/validate.js에서 유효성 검사 함수 import
import { validatePassword } from '../../utils/validate.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM 요소 ---
    const form = document.getElementById('password-update-form');
    const passwordInput = document.getElementById('password');
    const passwordCheckInput = document.getElementById('password-check');
    const passwordHelper = document.getElementById('password-helper');
    const passwordCheckHelper = document.getElementById('password-check-helper');
    const submitButton = document.getElementById('submit-button');

    // --- 2. 유효성 검사 상태 ---
    const validationStatus = {
        password: false,        // 비밀번호 형식
        passwordCheck: false    // 비밀번호 일치
    };

    // --- 3. 버튼 활성화 로직 ---
    function updateButtonState() {
        // 두 가지 유효성 검사를 모두 통과해야 버튼 활성화
        submitButton.disabled = !(validationStatus.password && validationStatus.passwordCheck);
    }

    // --- 4. (Req 1) 유효성 검사 통합 함수 ---
    function validateInputs() {
        const password = passwordInput.value;
        const passwordCheck = passwordCheckInput.value;

        // 1. 비밀번호 필드 유효성 검사 (형식)
        const passwordMessage = validatePassword(password);
        passwordHelper.textContent = passwordMessage;
        validationStatus.password = (passwordMessage === "");

        // 2. 비밀번호 확인 필드 유효성 검사 (일치 여부)
        if (passwordCheck === "") {
            passwordCheckHelper.textContent = "비밀번호를 한번 더 입력하세요.";
            validationStatus.passwordCheck = false;
        } else if (password !== passwordCheck) {
            passwordCheckHelper.textContent = "비밀번호와 다릅니다.";
            validationStatus.passwordCheck = false;
        } else {
            passwordCheckHelper.textContent = ""; // 일치
            validationStatus.passwordCheck = true;
        }

        // 3. (Req 1) 확인 필드에 값이 있는데, 첫 번째 비밀번호와 일치하지 않으면
        //    첫 번째 비밀번호 헬퍼 텍스트도 변경
        if (validationStatus.password && !validationStatus.passwordCheck && passwordCheck !== "") {
            passwordHelper.textContent = "비밀번호 확인과 다릅니다.";
            validationStatus.password = false; // (중요) 불일치 시 첫 번째 필드도 '유효하지 않음' 처리
        }

        // 4. 버튼 상태 업데이트
        updateButtonState();
    }

    // --- 5. 이벤트 리스너 ---
    passwordInput.addEventListener('input', validateInputs);
    passwordCheckInput.addEventListener('input', validateInputs);

    // --- 6. (Req 2) 폼 제출 로직 ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // 최종 검사
        validateInputs();
        if (submitButton.disabled) return; // 버튼이 비활성화면 중단

        // (가상) 서버 API 호출
        try {
            // (참고) 실제 개발 시:
            // const response = await fetch('/api/user/password', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ newPassword: passwordInput.value })
            // });
            // if (!response.ok) throw new Error('비밀번호 변경에 실패했습니다.');

            // --- 테스트용 임시 코드 ---
            console.log('새 비밀번호 전송:', passwordInput.value);
            // --- 테스트용 임시 코드 끝 ---

            // (Req 2) 수정 성공 시 (alert 사용)
            alert('수정 완료');
            
            // (선택) 수정 완료 후, 회원정보 수정 페이지로 이동
            window.location.href = '../userUpdate/UserUpdatePage.html';

        } catch (error) {
            alert(error.message);
        }
    });
});