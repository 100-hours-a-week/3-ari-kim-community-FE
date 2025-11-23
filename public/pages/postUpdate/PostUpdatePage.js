const API_BASE_URL = 'http://localhost:8080/api';
import { uploadFileToS3, deleteFileFromS3 } from '../../utils/s3Upload.js';

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
        const response = await fetch(`${API_BASE_URL}/posts/${id}`);
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');
        const data = await response.json();
        return data.success ? data.data : data;
    }

    // --- 폼에 기존 데이터 채우기 ---
    async function populateForm() {
        // URL에서 게시글 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('id');
        
        if (!postId) {
            alert('잘못된 접근입니다.');
            window.location.href = '../postList/PostListPage.html';
            return;
        }

        try {
            const data = await fetchPostData(postId);
            postTitle.value = data.title;
            postContent.value = data.content;
            existingImageUrl = data.imageUrl;
            
            if (data.imageUrl) {
                existingImageName.textContent = '기존 이미지 있음';
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
            if (response.ok && data.success) {
                alert('게시글이 성공적으로 수정되었습니다.');
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