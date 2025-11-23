const API_BASE_URL = 'http://localhost:8080/api';
import { uploadFileToS3 } from '../../utils/s3Upload.js';

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
            if (imageFile) {
                imageUrl = await uploadFileToS3(imageFile, 'posts');
            }

            // 2. Spring Boot API에 게시물 등록 요청 (S3 URL 포함)
            const accessToken = localStorage.getItem('accessToken');
            const userId = parseInt(localStorage.getItem('userId'), 10);

            const response = await fetch(`${API_BASE_URL}/posts`, {
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

            const data = await response.json();
            if (response.ok && data.success) {
                alert('게시글이 성공적으로 등록되었습니다.');
                window.location.href = `/posts/${data.data.postId}`;
            } else {
                const errorMessage = data?.message || '게시글 등록에 실패했습니다.';
                alert(`등록 실패: ${errorMessage}`);
            }

        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            alert('게시글 등록 중 오류가 발생했습니다.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '게시글 작성';
        }
    });
});