const API_BASE_URL = 'http://localhost:8080/api';
import { validateNickname } from '../../utils/validation.js';
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3Upload.js';

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
    let existingProfileUrl = null; // 기존 프로필 URL
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
            
            existingProfileUrl = data.profilePicUrl;
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

        try {
            submitButton.disabled = true;
            submitButton.textContent = '업로드 중...';

            // 1. 새 프로필 사진이 있으면 S3에 업로드
            let profileUrl = existingProfileUrl; // 기존 프로필 URL 유지
            if (profilePicFile) {
                // 기존 프로필이 있으면 삭제
                if (existingProfileUrl) {
                    try {
                        await deleteFileFromS3(existingProfileUrl);
                    } catch (error) {
                        console.warn('기존 프로필 삭제 실패:', error);
                    }
                }
                // 새 프로필 업로드
                profileUrl = await uploadFileToS3(profilePicFile, 'users');
            }

            // 2. Spring Boot API에 회원정보 수정 요청 (S3 URL 포함)
            const accessToken = localStorage.getItem('accessToken');
            const userId = parseInt(localStorage.getItem('userId'), 10);

            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                },
                body: JSON.stringify({
                    nickname: nicknameInput.value,
                    profileUrl: profileUrl
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                alert('수정 완료');
            } else {
                const errorMessage = data?.message || '수정에 실패했습니다.';
                if (errorMessage.includes('닉네임')) {
                    nicknameHelper.textContent = errorMessage;
                } else {
                    alert(`수정 실패: ${errorMessage}`);
                }
            }

        } catch (error) {
            console.error('회원정보 수정 중 오류:', error);
            alert(`수정 실패: ${error.message || '오류가 발생했습니다.'}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '수정 완료';
        }
    });

    // --- 회원 탈퇴 로직 ---
    deleteAccountLink.addEventListener('click', (e) => {
        e.preventDefault();
        deleteAccountModal.classList.remove('modal-hidden');
    });

    cancelDeleteBtn.addEventListener('click', () => {
        deleteAccountModal.classList.add('modal-hidden');
    });

    confirmDeleteBtn.addEventListener('click', async () => {
        // 서버 API 호출
        try {
            const response = await fetch('/api/user/account', {
                method: 'DELETE'
                // headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('탈퇴 처리에 실패했습니다.');
            
            alert('회원 탈퇴가 완료되었습니다.');
            window.location.href = '../login/LoginPage.html'; // 로그인 페이지로 이동

        } catch (error) {
            alert(error.message);
        }
    });

    // --- 페이지 초기화 실행 ---
    populateForm();
});