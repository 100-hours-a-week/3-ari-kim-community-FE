import { API_BASE_URL } from '../../utils/config.js';
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3Upload.js';
import { showToastAfterRedirect } from '../../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM 요소 ---
    const postForm = document.getElementById('post-update-form');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const existingImageName = document.getElementById('existing-image-name');
    const postImage = document.getElementById('post-image');
    const submitButton = document.getElementById('submit-button');
    const titleHelper = document.getElementById('title-helper');

    let imageFile = null; // 새로 업로드할 이미지 파일
    let postId = null; // 수정할 게시글 ID
    let existingImageUrl = null; // 기존 이미지 URL

    // --- 버튼 활성화 로직 ---
    function updateButtonState() {
        const title = postTitle.value.trim();
        const content = postContent.value.trim();
        
        // 제목과 본문이 모두 채워지면 버튼 활성화
        submitButton.disabled = !(title.length > 0 && content.length > 0);
    }

    // --- 기존 게시글 데이터 불러오기 ---
    async function fetchPostData(id) {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': accessToken ? `Bearer ${accessToken}` : ''
            }
        });
        
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.clear();
                window.location.href = '/login';
                return null;
            }
            throw new Error('게시글을 불러올 수 없습니다.');
        }
        
        const apiResponse = await response.json();
        if (apiResponse && (apiResponse.status === 200 || response.status === 200)) {
            return apiResponse.data;
        }
        throw new Error('게시글을 불러올 수 없습니다.');
    }

    // --- 폼에 기존 데이터 채우기 ---
    async function populateForm() {
        // URL 경로에서 게시글 ID 가져오기 (/posts/123/edit -> 123)
        const pathParts = window.location.pathname.split('/');
        const postIdIndex = pathParts.indexOf('posts') + 1;
        postId = postIdIndex > 0 && pathParts[postIdIndex] ? pathParts[postIdIndex] : null;
        
        if (!postId) {
            alert('잘못된 접근입니다.');
            window.location.href = '/posts';
            return;
        }

        try {
            const data = await fetchPostData(postId);
            postTitle.value = data.title;
            postContent.value = data.content;
            existingImageUrl = data.imageUrl;
            
            if (data.imageUrl) {
                // S3 URL에서 파일명 추출
                try {
                    const url = new URL(data.imageUrl, window.location.origin);
                    const pathParts = url.pathname.split('/');
                    const fileName = pathParts[pathParts.length - 1];
                    // URL 디코딩하여 한글 파일명 복원
                    const decodedFileName = decodeURIComponent(fileName);
                    // 타임스탬프 제거 (형식: 타임스탬프_원본파일명)
                    // 예: "1764134922484_많이 타버린 케이크.png" -> "많이 타버린 케이크.png"
                    const originalFileName = decodedFileName.replace(/^\d+_/, '');
                    existingImageName.textContent = originalFileName;
                } catch (e) {
                    // URL 파싱 실패 시 전체 경로에서 파일명 추출 시도
                    const urlParts = data.imageUrl.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    try {
                        const decodedFileName = decodeURIComponent(fileName);
                        // 타임스탬프 제거
                        const originalFileName = decodedFileName.replace(/^\d+_/, '');
                        existingImageName.textContent = originalFileName;
                    } catch (decodeError) {
                        // 타임스탬프 제거 시도
                        const originalFileName = fileName.replace(/^\d+_/, '');
                        existingImageName.textContent = originalFileName || '기존 이미지 있음';
                    }
                }
            }
            
            // 데이터 로드 후 버튼 상태 즉시 업데이트
            updateButtonState();

        } catch (error) {
            alert(error.message);
            window.location.href = '/';
        }
    }

    // --- 이벤트 리스너 ---
    
    // 실시간 유효성 검사 및 버튼 활성화
    postTitle.addEventListener('input', updateButtonState);
    postContent.addEventListener('input', updateButtonState);

    // 새 이미지 파일 저장
    postImage.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            imageFile = file;
            // (수정) 새 파일 선택 시 "기존 파일" 텍스트 대신 새 파일명 표시
            existingImageName.textContent = `(새 파일) ${file.name}`;
        }
    });

    // 폼 제출 (수정) 로직
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const title = postTitle.value.trim();
        const content = postContent.value.trim();

        if (title.length === 0 || content.length === 0) {
            titleHelper.textContent = "*제목, 내용을 모두 작성해주세요";
            return;
        }

        try {
            submitButton.disabled = true;
            submitButton.textContent = '업로드 중...';

            // 1. 새 이미지가 있으면 S3에 업로드
            let imageUrl = existingImageUrl; // 기존 이미지 URL 유지
            if (imageFile) {
                // 기존 이미지가 있으면 삭제
                if (existingImageUrl) {
                    try {
                        await deleteFileFromS3(existingImageUrl);
                    } catch (error) {
                        console.warn('기존 이미지 삭제 실패:', error);
                    }
                }
                // 새 이미지 업로드
                imageUrl = await uploadFileToS3(imageFile, 'posts');
            }

            // 2. Spring Boot API에 게시물 수정 요청 (S3 URL 포함)
            const accessToken = localStorage.getItem('accessToken');
            const userId = parseInt(localStorage.getItem('userId'), 10);

            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
                method: 'PATCH',
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

            const data = await response.json();
            if (response.ok && data && (data.status === 200 || response.status === 200)) {
                showToastAfterRedirect('게시글이 수정되었습니다.');
                window.location.href = `/posts/${postId}`;
            } else {
                const errorMessage = data?.message || '게시글 수정에 실패했습니다.';
                alert(`수정 실패: ${errorMessage}`);
            }

        } catch (error) {
            console.error('게시글 수정 중 오류:', error);
            alert('게시글 수정 중 오류가 발생했습니다.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '수정 완료';
        }
    });

    // --- 페이지 초기화 실행 ---
    populateForm();
});