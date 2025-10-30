const API_BASE_URL = 'http://localhost:8080/api';
import { validatePassword } from '/utils/validation.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM 요소 ---
    const form = document.getElementById('password-update-form');
    const passwordInput = document.getElementById('password');
    const passwordCheckInput = document.getElementById('password-check');
    const passwordHelper = document.getElementById('password-helper');
    const passwordCheckHelper = document.getElementById('password-check-helper');
    const submitButton = document.getElementById('submit-button');

    // --- 유효성 검사 상태 ---
    const validationStatus = {
        password: false,        // 비밀번호 형식
        passwordCheck: false    // 비밀번호 일치
    };

    // --- 버튼 활성화 로직 ---
    function updateButtonState() {
        // 두 가지 유효성 검사를 모두 통과해야 버튼 활성화
        submitButton.disabled = !(validationStatus.password && validationStatus.passwordCheck);
    }

    // --- 유효성 검사 통합 함수 ---
    function validateInputs() {
        const password = passwordInput.value;
        const passwordCheck = passwordCheckInput.value;

        // 비밀번호 필드 유효성 검사 (형식)
        const passwordMessage = validatePassword(password);
        passwordHelper.textContent = passwordMessage;
        validationStatus.password = (passwordMessage === "");

        // 비밀번호 확인 필드 유효성 검사 (일치 여부)
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

        // 확인 필드에 값이 있는데, 첫 번째 비밀번호와 일치하지 않으면 첫 번째 비밀번호 헬퍼 텍스트도 변경
        if (validationStatus.password && !validationStatus.passwordCheck && passwordCheck !== "") {
            passwordHelper.textContent = "비밀번호 확인과 다릅니다.";
            validationStatus.password = false; // 불일치 시 첫 번째 필드도 '유효하지 않음' 처리
        }

        // 버튼 상태 업데이트
        updateButtonState();
    }

    // --- 이벤트 리스너 ---
    passwordInput.addEventListener('input', validateInputs);
    passwordCheckInput.addEventListener('input', validateInputs);

    // --- 폼 제출 로직 ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // 최종 검사
        validateInputs();
        if (submitButton.disabled) return; // 버튼이 비활성화면 중단

        // URL에서 userId 추출 <- 추후 수정
        const pathParts = window.location.pathname.split('/');
        const userId = pathParts[2];

        if (!userId) {
            alert('사용자 ID를 찾을 수 없습니다.');
            return;
        }

        // 서버 API 호출
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput.value, passwordCheck: passwordCheckInput.value })
            });
            if (!response.ok) {
               const errorResponse = await response.json();
               throw new Error(errorResponse.message || '비밀번호 변경에 실패했습니다.');
           }

            // 수정 성공 시 (alert 사용)
            alert('수정 완료');
            // 수정 완료 후, 게시물 목록 페이지로 이동
            window.location.href = `/posts`;

        } catch (error) {
            alert(error.message);
        }
    });
});