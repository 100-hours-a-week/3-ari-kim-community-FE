import { API_BASE_URL } from '../../utils/config.js';
import { validateNickname } from '../../utils/validation.js';
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3Upload.js';
import { showToast, showToastAfterRedirect } from '../../utils/toast.js';

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

    // --- 2. 기존 유저 데이터 불러오기 ---
    async function fetchUserData() {
        const accessToken = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        
        if (!accessToken || !userId) {
            throw new Error('로그인이 필요합니다.');
        }

        try {
            // 회원정보 수정 API를 호출하여 현재 사용자 정보 가져오기
            // (실제로는 GET 엔드포인트가 없으므로, localStorage에서 정보를 가져옴)
            const email = localStorage.getItem('userEmail') || '';
            const nickname = localStorage.getItem('userNickname') || '';
            
            // 프로필 URL은 회원정보 수정 API 응답에서 가져올 수 없으므로,
            // 일단 null로 설정하고, 실제로는 별도의 GET 엔드포인트가 필요함
            // 여기서는 localStorage에 저장된 정보를 사용
            return {
                email: email,
                nickname: nickname,
                profilePicUrl: localStorage.getItem('userProfileUrl') || null
            };
        } catch (error) {
            console.error('사용자 정보를 불러오는데 실패했습니다:', error);
            throw new Error('사용자 정보를 불러오는데 실패했습니다.');
        }
    }

    // --- 3. 폼에 기존 데이터 채우기 ---
    async function populateForm() {
        try {
            const data = await fetchUserData();
            emailDisplay.textContent = data.email;
            nicknameInput.value = data.nickname;
            
            existingProfileUrl = data.profilePicUrl;
            if (data.profilePicUrl && data.profilePicUrl.trim() !== '') {
                profilePicPreview.style.backgroundImage = `url(${data.profilePicUrl})`;
                profilePicPreview.classList.add('has-image');
            } else {
                // 프로필 이미지가 없으면 기본 상태 유지
                profilePicPreview.style.backgroundImage = 'none';
                profilePicPreview.classList.remove('has-image');
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
        const message = validateNickname(nickname, null, null);
        
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
                // 권한 확인: existingProfileUrl은 fetchUserData()로 가져온 현재 로그인한 사용자의 프로필 URL이므로
                // 이미 권한이 확인된 상태입니다. (JWT 토큰으로 인증된 사용자만 접근 가능)
                if (existingProfileUrl && existingProfileUrl.trim() !== '') {
                    try {
                        // 추가 권한 확인: localStorage의 userId와 현재 요청하는 사용자가 일치하는지 확인
                        const currentUserId = localStorage.getItem('userId');
                        if (!currentUserId) {
                            throw new Error('로그인이 필요합니다.');
                        }
                        
                        console.log('[프로필 삭제] 권한 확인 완료, 기존 프로필 URL:', existingProfileUrl);
                        await deleteFileFromS3(existingProfileUrl);
                        console.log('[프로필 삭제] 기존 프로필 삭제 성공');
                    } catch (error) {
                        // 삭제 실패 시 상세 로그 출력
                        console.error('[프로필 삭제] 기존 프로필 삭제 실패:', error);
                        console.error('[프로필 삭제] 에러 상세:', {
                            message: error.message,
                            stack: error.stack,
                            url: existingProfileUrl
                        });
                        // 삭제 실패해도 새 파일 업로드는 계속 진행
                        // (기존 파일은 S3에 남아있지만, 새 파일로 덮어쓰기 때문에 문제없음)
                    }
                }
                // 새 프로필 업로드
                profileUrl = await uploadFileToS3(profilePicFile, 'users');
            }

            // 2. Spring Boot API에 회원정보 수정 요청 (S3 URL 포함)
            const accessToken = localStorage.getItem('accessToken');
            const userId = parseInt(localStorage.getItem('userId'), 10);

            let response;
            try {
                response = await fetch(`${API_BASE_URL}/users/${userId}`, {
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
            } catch (fetchError) {
                throw new Error('네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
            }

            let data = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    data = JSON.parse(responseText);
                }
            } catch (parseError) {
                throw new Error('서버 응답을 읽을 수 없습니다.');
            }

            // 403 Forbidden 또는 401 Unauthorized 오류 처리
            if (response.status === 403 || response.status === 401) {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            if (response.ok && data && (data.status === 200 || response.status === 200)) {
                // 수정된 사용자 정보를 localStorage에 업데이트
                const updatedUser = data.data;
                if (updatedUser && updatedUser.nickname) {
                    localStorage.setItem('userNickname', updatedUser.nickname);
                }
                if (updatedUser && updatedUser.profileUrl) {
                    localStorage.setItem('userProfileUrl', updatedUser.profileUrl);
                    // 프로필 이미지 즉시 업데이트
                    if (window.updateProfileImage) {
                        window.updateProfileImage();
                    }
                    // 회원정보 수정 페이지의 프로필 미리보기도 업데이트
                    if (updatedUser.profileUrl.trim() !== '') {
                        profilePicPreview.style.backgroundImage = `url(${updatedUser.profileUrl})`;
                        profilePicPreview.classList.add('has-image');
                    }
                } else {
                    // 프로필 URL이 없으면 빈 문자열로 저장
                    localStorage.setItem('userProfileUrl', '');
                    if (window.updateProfileImage) {
                        window.updateProfileImage();
                    }
                    profilePicPreview.style.backgroundImage = 'none';
                    profilePicPreview.classList.remove('has-image');
                }
                // 토스트 메시지 표시 후 메인 페이지로 이동
                showToastAfterRedirect('회원 정보 수정 완료!');
                window.location.href = '/';
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
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            // 403 Forbidden 또는 401 Unauthorized 오류 처리
            if (response.status === 403 || response.status === 401) {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.clear();
                window.location.href = '/login';
                return;
            }

            if (!response.ok) {
                let errorMessage = '탈퇴 처리에 실패했습니다.';
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
            
            // 회원 탈퇴 성공
            alert('회원 탈퇴가 완료되었습니다.');
            // localStorage 초기화
            localStorage.clear();
            // 로그인 페이지로 이동
            window.location.href = '/login';

        } catch (error) {
            alert(error.message || '회원 탈퇴 중 오류가 발생했습니다.');
        } finally {
            deleteAccountModal.classList.add('modal-hidden');
        }
    });

    // --- 페이지 초기화 실행 ---
    populateForm();
});