const API_BASE_URL = 'http://localhost:8080/api';
import { uploadFileToS3 } from '../../utils/s3Upload.js';
import { showToastAfterRedirect } from '../../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM 요소 ---
    const postForm = document.getElementById('post-create-form');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const postImage = document.getElementById('post-image');
    const submitButton = document.getElementById('submit-button');
    const titleHelper = document.getElementById('title-helper');
    const contentHelper = document.getElementById('content-helper');

    let imageFile = null; // 업로드할 이미지 파일

    // --- 버튼 활성화 로직 ---
    function updateButtonState() {
        const title = postTitle.value.trim();
        const content = postContent.value.trim();
        
        // 제목과 본문이 모두 채워지면 버튼 활성화
        if (title.length > 0 && content.length > 0) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    // --- 이미지 파일 저장 ---
    postImage.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            imageFile = file;
            // (선택) 이미지 미리보기 로직을 여기에 추가할 수 있습니다.
        }
    });

    // --- 실시간 유효성 검사 및 버튼 활성화 ---
    postTitle.addEventListener('input', updateButtonState);
    postContent.addEventListener('input', updateButtonState);

    // --- 폼 제출 로직 ---
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 폼 기본 제출(새로고침) 방지

        const title = postTitle.value.trim();
        const content = postContent.value.trim();

        // 제출 시 최종 유효성 검사
        if (title.length === 0 || content.length === 0) {
            titleHelper.textContent = "*제목, 내용을 모두 작성해주세요";
            return;
        } else {
            titleHelper.textContent = "";
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = '업로드 중...';

            // 1. 이미지가 있으면 S3에 업로드
            let imageUrl = null;
            const imageHelper = document.getElementById('image-helper');
            if (imageFile) {
                try {
                    imageUrl = await uploadFileToS3(imageFile, 'posts');
                    if (imageHelper) {
                        imageHelper.textContent = '* 제목과 내용을 모두 작성해 주세요';
                        imageHelper.style.color = '';
                    }
                } catch (uploadError) {
                    // S3 업로드 실패 시 사용자 친화적인 메시지 표시
                    if (imageHelper) {
                        imageHelper.textContent = '이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.';
                        imageHelper.style.color = '#e03131';
                    }
                    throw uploadError; // 상위 catch 블록에서 처리하도록 재throw
                }
            }

            // 2. Spring Boot API에 게시물 등록 요청 (S3 URL 포함)
            const accessToken = localStorage.getItem('accessToken');
            const userId = parseInt(localStorage.getItem('userId'), 10);

            // userId가 유효한지 확인
            if (!userId || isNaN(userId)) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login';
                return;
            }

            let response;
            try {
                response = await fetch(`${API_BASE_URL}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                    },
                    body: JSON.stringify({
                        userId: userId,
                        title: title,
                        content: content,
                        imageUrl: imageUrl
                    })
                });
            } catch (networkError) {
                // 네트워크 오류 (서버에 연결할 수 없음)
                throw new Error('네트워크 오류: 서버에 연결할 수 없습니다.');
            }

            // 응답을 JSON으로 파싱 (성공/실패 모두)
            let data = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    data = JSON.parse(responseText);
                }
            } catch (parseError) {
                // JSON 파싱 실패 시
                throw new Error('서버 응답을 읽을 수 없습니다.');
            }

            if (response.ok && data && (data.status === 200 || response.status === 200)) {
                const postId = data.data?.postId;
                if (!postId) {
                    alert('게시글 ID를 받을 수 없습니다.');
                    return;
                }
                // 토스트 메시지 표시 후 게시물 상세 페이지로 이동
                showToastAfterRedirect('게시물이 작성되었습니다!');
                window.location.href = `/posts/${postId}`;
            } else {
                // 서버에서 반환한 에러 메시지 표시
                const errorMessage = data?.message || '게시글 등록에 실패했습니다.';
                
                // 에러 메시지에 따라 적절한 필드에 표시
                if (errorMessage.includes('제목') || errorMessage.includes('유효하지 않은')) {
                    titleHelper.textContent = errorMessage;
                } else if (errorMessage.includes('내용') || errorMessage.includes('유효하지 않은')) {
                    contentHelper.textContent = errorMessage;
                } else if (errorMessage.includes('사용자') || errorMessage.includes('로그인') || errorMessage.includes('인증') || errorMessage.includes('권한')) {
                    alert(`등록 실패: ${errorMessage}`);
                    window.location.href = '/login';
                } else {
                    alert(`등록 실패: ${errorMessage}`);
                }
            }

        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            
            // 네트워크 오류나 기타 예외 처리
            let errorMessage = '게시글 등록 중 오류가 발생했습니다.';
            
            // S3 업로드 실패인 경우
            if (error.message && (error.message.includes('S3') || error.message.includes('업로드') || error.message.includes('Lambda'))) {
                errorMessage = '이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.';
                const imageHelper = document.getElementById('image-helper');
                if (imageHelper) {
                    imageHelper.textContent = errorMessage;
                    imageHelper.style.color = '#e03131';
                }
            } else if (error.message && error.message.includes('네트워크')) {
                errorMessage = '네트워크 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.';
            } else if (error.message) {
                // 사용자 친화적인 메시지로 변경 (기술적인 오류 메시지 숨김)
                errorMessage = '게시글 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            }
            
            alert(errorMessage);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '게시글 작성';
        }
    });
});