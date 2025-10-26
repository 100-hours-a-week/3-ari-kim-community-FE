// 1. (경로 확인) utils/validate.js에서 닉네임 유효성 검사 함수 import
import { validateNickname } from '../../utils/validation.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM 요소 ---
    const form = document.getElementById('user-update-form');
    const profilePicInput = document.getElementById('profile-pic-input');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const emailDisplay = document.getElementById('email-display');
    const nicknameInput = document.getElementById('nickname');
    const nicknameHelper = document.getElementById('nickname-helper');
    const submitButton = document.getElementById('submit-button');

    const deleteAccountLink = document.getElementById('delete-account-link');
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    let profilePicFile = null; // 새로 선택한 프로필 파일
    let isNicknameValid = false; // 닉네임 유효성 상태

    // --- 2. (가상) 기존 유저 데이터 불러오기 ---
    async function fetchUserData() {
        // (참고) 실제 개발 시:
        // const response = await fetch('/api/user/me'); // (예시)
        // if (!response.ok) throw new Error('사용자 정보를 불러오는데 실패했습니다.');
        // return await response.json();

        // --- 테스트용 임시 코드 ---
        console.log('[테스트 모드] 사용자 정보 불러오는 중...');
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
            email: 'startupcode@gmail.com',
            nickname: '스타트업코드',
            profilePicUrl: null // (예: 'http://.../profile.jpg')
        };
        // --- 테스트용 임시 코드 끝 ---
    }

    // --- 3. 폼에 기존 데이터 채우기 ---
    async function populateForm() {
        try {
            const data = await fetchUserData();
            emailDisplay.textContent = data.email;
            nicknameInput.value = data.nickname;
            
            if (data.profilePicUrl) {
                profilePicPreview.style.backgroundImage = `url(${data.profilePicUrl})`;
                profilePicPreview.classList.add('has-image');
            }
            
            // 폼이 채워진 후, 초기 유효성 검사 및 버튼 상태 업데이트
            handleNicknameInput();

        } catch (error) {
            alert(error.message);
        }
    }

    // --- 4. 닉네임 유효성 검사 및 버튼 활성화 ---
    function handleNicknameInput() {
        const nickname = nicknameInput.value;
        const message = validateNickname(nickname);
        
        nicknameHelper.textContent = message;
        isNicknameValid = (message === ""); // 메시지가 없어야 유효함
        
        // (수정) 닉네임이 유효할 때만 버튼 활성화
        submitButton.disabled = !isNicknameValid;
    }

    nicknameInput.addEventListener('input', handleNicknameInput);

    // --- 5. 프로필 사진 변경 로직 ---
    profilePicPreview.addEventListener('click', () => {
        profilePicInput.click();
    });

    profilePicInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            profilePicFile = file; // 새 파일 저장
            // FileReader로 이미지 미리보기
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePicPreview.style.backgroundImage = `url(${e.target.result})`;
                profilePicPreview.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });

    // --- 6. 폼 제출 (수정하기) ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // 최종 닉네임 유효성 검사
        handleNicknameInput();
        if (!isNicknameValid) return;

        // FormData 생성
        const formData = new FormData();
        formData.append('nickname', nicknameInput.value);
        if (profilePicFile) { // 새 이미지가 선택된 경우에만
            formData.append('profilePic', profilePicFile);
        }

        // (가상) 서버 API 호출
        try {
            // (참고) 실제 개발 시:
            // const response = await fetch('/api/user/profile', {
            //     method: 'PUT', // 또는 'PATCH'
            //     body: formData
            //     // headers: { 'Authorization': `Bearer ${token}` }
            // });
            // if (!response.ok) {
            //     const errorData = await response.json();
            //     throw errorData; // (예: { field: 'nickname', message: '중복된 닉네임 입니다.' })
            // }

            // --- 테스트용 임시 코드 ---
            console.log('서버로 전송될 (수정) 데이터:', {
                nickname: nicknameInput.value,
                profilePicFile
            });
            // --- 테스트용 임시 코드 끝 ---

            // 수정 완료
            alert('수정 완료'); // (요청 사항) alert 사용

        } catch (error) {
            // 중복 닉네임 등 서버 에러 처리
            if (error.field === 'nickname') {
                nicknameHelper.textContent = error.message;
            } else {
                alert(`수정 실패: ${error.message}`);
            }
        }
    });

    // --- 7. 회원 탈퇴 로직 ---
    deleteAccountLink.addEventListener('click', (e) => {
        e.preventDefault();
        deleteAccountModal.classList.remove('modal-hidden');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteAccountModal.classList.add('modal-hidden');
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        // (가상) 서버 API 호출
        try {
            // (참고) 실제 개발 시:
            // const response = await fetch('/api/user/account', {
            //     method: 'DELETE'
            //     // headers: { 'Authorization': `Bearer ${token}` }
            // });
            // if (!response.ok) throw new Error('탈퇴 처리에 실패했습니다.');

            // --- 테스트용 임시 코드 ---
            console.log('회원 탈퇴 API 호출...');
            // --- 테스트용 임시 코드 끝 ---
            
            alert('회원 탈퇴가 완료되었습니다.');
            window.location.href = '../login/LoginPage.html'; // 로그인 페이지로 이동

        } catch (error) {
            alert(error.message);
        }
    });

    // --- 8. 페이지 초기화 실행 ---
    populateForm();
});