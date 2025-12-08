import { API_BASE_URL } from '../../utils/config.js';
import { validatePassword } from '/utils/validation.js';
import { showToastAfterRedirect } from '../../utils/toast.js';

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

        // localStorage에서 userId와 accessToken 가져오기
        const userId = parseInt(localStorage.getItem('userId'), 10);
        const accessToken = localStorage.getItem('accessToken');

        if (!userId || isNaN(userId)) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login';
            return;
        }

        if (!accessToken) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            localStorage.clear();
            window.location.href = '/login';
            return;
        }

        // 서버 API 호출
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}/password`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ 
                    password: passwordInput.value, 
                    passwordCheck: passwordCheckInput.value 
                })
            });

            // 403 Forbidden 또는 401 Unauthorized 오류 처리
            if (response.status === 403 || response.status === 401) {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                let errorMessage = '비밀번호 변경에 실패했습니다.';
                try {
                    const responseText = await response.text();
                    if (responseText) {
                        const errorResponse = JSON.parse(responseText);
                        errorMessage = errorResponse.message || errorResponse.data?.message || errorMessage;
                    }
                } catch (parseError) {
                    // JSON 파싱 실패 시 기본 메시지 사용
                }
                throw new Error(errorMessage);
            }

            // 응답 처리
            let data = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    data = JSON.parse(responseText);
                }
            } catch (parseError) {
                // 응답이 비어있거나 JSON이 아닌 경우 무시
            }

            // 수정 성공 시 토스트 메시지 표시
            showToastAfterRedirect('비밀번호가 변경되었습니다.');
            // 수정 완료 후, 게시물 목록 페이지로 이동
            window.location.href = `/posts`;

        } catch (error) {
            alert(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
        }
    });
});